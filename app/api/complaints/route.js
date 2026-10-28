import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import cloudinary from "@/lib/cloudinary";
import { FieldValue } from "firebase-admin/firestore";
import { authenticateApiRequest } from "@/lib/api-auth";
import { MAX_COMPLAINT_IMAGES, MAX_IMAGE_SIZE_BYTES, readValidatedImage } from "@/lib/image-validation";
import { parseFormDataLimited, RequestBodyError } from "@/lib/request-body";
import { COMPLAINT_CATEGORIES, isComplaintAuthority } from "@/lib/complaint-options";

export const runtime = "nodejs";

// Simple native profanity filter
const PROFANITY_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard", "slut", "whore", "fag", "nigger", "nigga"];
function isProfane(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return PROFANITY_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(normalized);
  });
}

const DAILY_COMPLAINT_LIMIT = 5;
const CLOSED_STATUSES = new Set(["resolved", "rejected", "closed"]);
const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];
const DUPLICATE_SIMILARITY_THRESHOLD = 0.35;
const PRIORITIES = new Set(["Low", "Medium", "High", "Critical"]);

function nextSeverity(current) {
  const idx = SEVERITY_LEVELS.indexOf(current || "Low");
  return SEVERITY_LEVELS[Math.min(idx + 1, SEVERITY_LEVELS.length - 1)];
}

function tokenize(text) {
  return new Set((text || "").toLowerCase().match(/[a-z0-9]+/g) || []);
}

// Jaccard similarity over word sets - lightweight duplicate detection without an external NLP dependency
function textSimilarity(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Groq vision model; override with GROQ_MODEL in .env if this one is retired
const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Asks Groq whether the image matches the complaint, retrying briefly on rate-limit/5xx errors.
// Returns { ok, answer } or { ok: false, unavailable, error }; "unavailable" means temporary.
async function callGroq(prompt, mimeType, base64Data) {
  const body = {
    model: GROQ_MODEL,
    temperature: 0,
    max_tokens: 5,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
      ],
    }],
  };
  let lastError = "Unknown Groq Error";
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const answer = (data?.choices?.[0]?.message?.content || "").trim().toUpperCase();
        if (answer.startsWith("YES") || answer.startsWith("NO")) return { ok: true, answer };
        return { ok: false, unavailable: true, error: "Groq returned an invalid verification response" };
      }
      lastError = "Groq request failed";
      if (res.status !== 429 && res.status < 500) return { ok: false, unavailable: true, error: lastError };
      // Free tier is token-per-minute limited: wait out the window Groq asks for (capped)
      const retryAfter = Number(res.headers.get("retry-after"));
      if (res.status === 429 && retryAfter > 0) {
        await sleep(Math.min(retryAfter, 20) * 1000);
        continue;
      }
    } catch (e) {
      lastError = e?.name === "AbortError" ? "Groq request timed out" : "Groq request failed";
    } finally {
      clearTimeout(timeout);
    }
    await sleep(800 * (attempt + 1));
  }
  return { ok: false, unavailable: true, error: lastError };
}

export async function POST(request) {
  try {
    const auth = await authenticateApiRequest(request, ["student", "department"]);
    if (auth.error) {
      return NextResponse.json({ success: false, message: auth.error.message }, { status: auth.error.status });
    }

    const formData = await parseFormDataLimited(request, 12 * 1024 * 1024 + 128 * 1024);

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "");
    const building = String(formData.get("building") || "").trim();
    const floor = String(formData.get("floor") || "").trim();
    const room = String(formData.get("room") || "").trim();
    const anonymousRaw = String(formData.get("anonymous") || "false");
    const taggedAuthority = String(formData.get("taggedAuthority") || "");
    const userId = auth.user.uid;
    const userEmail = auth.user.email;
    const asset = String(formData.get("asset") || "").trim().slice(0, 100);
    const severityScoreRaw = Number(formData.get("severityScore") || 3);
    const severityScore = Number.isInteger(severityScoreRaw) && severityScoreRaw >= 1 && severityScoreRaw <= 5 ? severityScoreRaw : 3;
    const priorityRaw = String(formData.get("priority") || "Medium");
    const priority = PRIORITIES.has(priorityRaw) ? priorityRaw : "Medium";
    const safetyConcern = formData.get("safetyConcern") === "true";
    const analysisReasoning = String(formData.get("analysisReasoning") || "").trim().slice(0, 280);

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, description, and category are required." },
        { status: 400 }
      );
    }
    if (!COMPLAINT_CATEGORIES.includes(String(category))) {
      return NextResponse.json({ success: false, message: "Choose a supported complaint category." }, { status: 400 });
    }
    if (title.length > 120 || description.length > 2000 || building.length > 120 || floor.length > 80 || room.length > 80) {
      return NextResponse.json({ success: false, message: "One or more report fields are too long." }, { status: 400 });
    }
    if (!building || !floor || !room) {
      return NextResponse.json({ success: false, message: "Complete building, floor, and room details are required." }, { status: 400 });
    }
    if (taggedAuthority && !isComplaintAuthority(taggedAuthority)) {
      return NextResponse.json({ success: false, message: "Choose a supported maintenance authority." }, { status: 400 });
    }

    // Profanity Filter Check
    if (isProfane(title) || isProfane(description)) {
      return NextResponse.json(
        { success: false, message: "Please be respectful. Derogatory or abusive words are not allowed in complaints." },
        { status: 400 }
      );
    }

    // --- Daily Submission Limit (5 complaints/day/user) ---
    {
      const submissionsSnap = await adminDb
        .collection("complaintSubmissions")
        .where("userId", "==", userId)
        .get();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const submissionsToday = submissionsSnap.docs.filter(
        (d) => new Date(d.data().createdAt) >= startOfToday
      ).length;

      if (submissionsToday >= DAILY_COMPLAINT_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            message: `You've reached the daily limit of ${DAILY_COMPLAINT_LIMIT} complaints. Please try again tomorrow.`,
          },
          { status: 429 }
        );
      }
    }

    // --- Duplicate Detection (same category + building, similar title/description) ---
    let matchedComplaintId = null;
    let matchedComplaintData = null;
    if (building) {
      const candidatesSnap = await adminDb
        .collection("complaints")
        .where("category", "==", category)
        .where("location.building", "==", building)
        .get();

      const newTokens = tokenize(`${title} ${description}`);
      let bestScore = 0;

      for (const candidate of candidatesSnap.docs) {
        const data = candidate.data();
        if (CLOSED_STATUSES.has((data.status || "").toLowerCase())) continue;

        const score = textSimilarity(newTokens, tokenize(`${data.title || ""} ${data.description || ""}`));
        if (score > bestScore) {
          bestScore = score;
          matchedComplaintId = candidate.id;
          matchedComplaintData = data;
        }
      }

      if (bestScore < DUPLICATE_SIMILARITY_THRESHOLD) {
        matchedComplaintId = null;
        matchedComplaintData = null;
      }
    }

    const files = (formData.getAll("file") || []).filter(file => file && file.size > 0);
    if (files.length > MAX_COMPLAINT_IMAGES) {
      return NextResponse.json({ success: false, message: `You can attach up to ${MAX_COMPLAINT_IMAGES} images.` }, { status: 400 });
    }
    if (files.some(file => file.size > MAX_IMAGE_SIZE_BYTES) || files.reduce((sum, file) => sum + file.size, 0) > 12 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "Each image must be 5 MB or smaller and all images together must be 12 MB or smaller." }, { status: 413 });
    }
    const uploadedUrls = [];

    // Upload files to Cloudinary
    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const validatedImage = await readValidatedImage(file);
          if (validatedImage.error) {
            return NextResponse.json({ success: false, message: validatedImage.error }, { status: 400 });
          }
          const { buffer, mimeType } = validatedImage;

          // --- AI Image Validation (Groq) ---
          if (process.env.GROQ_API_KEY) {
            const prompt = `You are a strict auditor verifying campus infrastructure complaints. Complaint category: '${category}'. Title: '${title}'. Description: '${description}'. Look at the image. Does it show a real photograph of the specific problem described (the same kind of object/fault)? Answer NO if it is a poster, logo, movie/game artwork, screenshot, meme, selfie, or any unrelated picture. Answer with exactly YES or NO.`;
            const groq = await callGroq(prompt, mimeType, buffer.toString("base64"));

            if (groq.ok) {
              console.log("Groq Parsed Answer:", groq.answer);

              if (!groq.answer.startsWith("YES")) {
                return NextResponse.json({
                  success: false,
                  message: "The uploaded image does not appear to match your description. Please upload a relevant picture."
                }, { status: 400 });
              }
            } else if (groq.unavailable) {
              // Groq is rate-limited/down: don't block the student, accept the photo unverified
              console.warn("Groq unavailable, skipping image verification:", groq.error);
            } else {
              console.error("Groq image verification failed.");
              return NextResponse.json({
                success: false,
                message: "Image verification is temporarily unavailable. Please retry or remove the photo and submit manually."
              }, { status: 502 });
            }
          }
          // --- End AI Validation ---

          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "image", folder: "infratrack/complaints" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(buffer);
          });

          if (uploadResult && uploadResult.secure_url) {
            uploadedUrls.push(uploadResult.secure_url);
          }
        } catch (uploadError) {
          console.error("Cloudinary image upload failed.", uploadError?.name || "Unknown error");
          return NextResponse.json(
            { success: false, message: "Image upload failed. Please retry." },
            { status: 500 }
          );
        }
      }
    }

    // Save to Firestore - merge into an existing duplicate if one was matched, otherwise create a new complaint
    let responseMessage = "Complaint submitted successfully";
    try {
      if (matchedComplaintId) {
        const escalatedSeverity = nextSeverity(matchedComplaintData.severity);
        const timelineEvent = {
          title: "Duplicate Report Received",
          date: new Date().toISOString().split("T")[0],
          description: `Another user reported the same issue. Severity escalated to ${escalatedSeverity}.`,
          status: "done",
          timestamp: new Date(),
        };

        const updatePayload = {
          severity: escalatedSeverity,
          severityScore: Math.max(Number(matchedComplaintData.severityScore) || 1, severityScore),
          priority: ["Low", "Medium", "High", "Critical"][Math.max(
            ["Low", "Medium", "High", "Critical"].indexOf(matchedComplaintData.priority || "Low"),
            ["Low", "Medium", "High", "Critical"].indexOf(priority)
          )],
          safetyConcern: matchedComplaintData.safetyConcern === true || safetyConcern,
          duplicateCount: (matchedComplaintData.duplicateCount || 0) + 1,
          duplicateReporters: FieldValue.arrayUnion(userId),
          timeline: FieldValue.arrayUnion(timelineEvent),
        };
        if (!matchedComplaintData.asset && asset) updatePayload.asset = asset;
        if (analysisReasoning) updatePayload.analysisReasoning = analysisReasoning;
        if (uploadedUrls.length > 0) {
          updatePayload.images = FieldValue.arrayUnion(...uploadedUrls);
        }

        await adminDb.collection("complaints").doc(matchedComplaintId).update(updatePayload);
        responseMessage = `This matches an existing complaint. Your report was merged and its severity escalated to ${escalatedSeverity}.`;
      } else {
        await adminDb.collection("complaints").add({
          userId,
          userEmail,
          title,
          description,
          category,
          location: { building, floor, room },
          images: uploadedUrls,
          status: "pending",
          severity: severityScore <= 1 ? "Low" : severityScore <= 3 ? "Medium" : severityScore === 4 ? "High" : "Critical",
          severityScore,
          priority,
          asset,
          safetyConcern,
          ...(analysisReasoning ? { analysisReasoning } : {}),
          duplicateCount: 0,
          duplicateReporters: [],
          createdAt: new Date().toISOString(),
          anonymous: anonymousRaw === "true" || anonymousRaw === "on",
          taggedAuthority,
          upvotes: [],
          comments: [],
        });
      }

      await adminDb.collection("complaintSubmissions").add({
        userId,
        createdAt: new Date().toISOString(),
      });
    } catch (firestoreError) {
      console.error("Complaint persistence failed.", firestoreError?.code || firestoreError?.name || "Unknown error");
      return NextResponse.json(
        { success: false, message: "Failed to save complaint. Please retry." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, merged: Boolean(matchedComplaintId), message: responseMessage });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("Complaint request failed.", error?.name || "Unknown error");
    return NextResponse.json(
      { success: false, message: "The complaint request failed. Please retry." },
      { status: 500 }
    );
  }
}
