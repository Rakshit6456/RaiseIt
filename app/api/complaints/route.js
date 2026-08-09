import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import cloudinary from "@/lib/cloudinary";
import { collection, addDoc, doc, updateDoc, query, where, getDocs, arrayUnion } from "firebase/firestore";

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

export async function POST(request) {
  try {
    const formData = await request.formData();

    const title = formData.get("title") || "";
    const description = formData.get("description") || "";
    const category = formData.get("category") || "";
    const building = formData.get("building") || "";
    const floor = formData.get("floor") || "";
    const room = formData.get("room") || "";
    const anonymousRaw = formData.get("anonymous") || "false";
    const taggedAuthority = formData.get("taggedAuthority") || "";
    const userId = formData.get("userId") || "unknown";
    const userEmail = formData.get("userEmail") || "unknown";

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: title, description, and category are required." },
        { status: 400 }
      );
    }

    // Profanity Filter Check
    if (isProfane(title) || isProfane(description)) {
      return NextResponse.json(
        { success: false, message: "Please be respectful. Derogatory or abusive words are not allowed in complaints." },
        { status: 400 }
      );
    }

    if (!db) {
      console.error("Firebase database not initialized");
      return NextResponse.json({ success: false, message: "Database not initialized" }, { status: 500 });
    }

    // --- Daily Submission Limit (5 complaints/day/user) ---
    if (userId && userId !== "unknown") {
      const submissionsSnap = await getDocs(
        query(collection(db, "complaintSubmissions"), where("userId", "==", userId))
      );
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
      const candidatesSnap = await getDocs(
        query(
          collection(db, "complaints"),
          where("category", "==", category),
          where("location.building", "==", building)
        )
      );

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

    const files = formData.getAll("file") || [];
    const uploadedUrls = [];

    // Upload files to Cloudinary
    for (const file of files) {
      if (file && file.size > 0) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = file.type || 'image/jpeg';

          // --- AI Image Validation (Gemini) ---
          if (process.env.GEMINI_API_KEY) {
            const base64Data = buffer.toString('base64');
            const payload = {
              contents: [{
                parts: [
                  { text: `You are an auditor verifying user complaints. The user claims this is a problem regarding: '${category}'. Their exact description is: '${description}'. Does this image depict the problem described? Answer with exactly YES or NO.` },
                  { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
              }]
            };

            try {
              const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const geminiData = await geminiRes.json();
              
              if (!geminiRes.ok) {
                console.error("Gemini API Error Response:", JSON.stringify(geminiData));
                return NextResponse.json({ 
                   success: false, 
                   message: `AI Image System Error: ${geminiData?.error?.message || "Unknown Gemini Error"}` 
                }, { status: 400 });
              }

              console.log("Gemini Raw Response:", JSON.stringify(geminiData));

              const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || "";
              console.log("Gemini Parsed Answer:", answer);
              
              if (!answer.includes("YES") && answer.includes("NO")) {
                 return NextResponse.json({ 
                   success: false, 
                   message: "The uploaded image does not appear to match your description. Please upload a relevant picture." 
                 }, { status: 400 });
              } else if (!answer) {
                 return NextResponse.json({ 
                   success: false, 
                   message: "AI could not determine image relevance." 
                 }, { status: 400 });
              }
            } catch (geminiError) {
              console.error("Gemini Validation Error:", geminiError);
              return NextResponse.json({ 
                   success: false, 
                   message: `AI Verification Failed Internally: ${geminiError.message}` 
                 }, { status: 500 });
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
          console.error("Cloudinary upload error:", uploadError);
          return NextResponse.json(
            { success: false, message: `Image upload failed: ${uploadError.message}` },
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
          duplicateCount: (matchedComplaintData.duplicateCount || 0) + 1,
          duplicateReporters: arrayUnion(userId),
          timeline: arrayUnion(timelineEvent),
        };
        if (uploadedUrls.length > 0) {
          updatePayload.images = arrayUnion(...uploadedUrls);
        }

        await updateDoc(doc(db, "complaints", matchedComplaintId), updatePayload);
        responseMessage = `This matches an existing complaint. Your report was merged and its severity escalated to ${escalatedSeverity}.`;
      } else {
        await addDoc(collection(db, "complaints"), {
          userId,
          userEmail,
          title,
          description,
          category,
          location: { building, floor, room },
          images: uploadedUrls,
          status: "pending",
          severity: "Low",
          duplicateCount: 0,
          duplicateReporters: [],
          createdAt: new Date().toISOString(),
          anonymous: anonymousRaw === "true" || anonymousRaw === "on",
          taggedAuthority,
          upvotes: [],
          comments: [],
        });
      }

      if (userId && userId !== "unknown") {
        await addDoc(collection(db, "complaintSubmissions"), {
          userId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (firestoreError) {
      console.error("Firestore save error:", firestoreError);
      return NextResponse.json(
        { success: false, message: `Failed to save complaint: ${firestoreError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, merged: Boolean(matchedComplaintId), message: responseMessage });
  } catch (error) {
    console.error("/api/complaints error:", error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
