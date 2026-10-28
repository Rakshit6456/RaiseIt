import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { GroqRequestError, requestGroqJson } from "@/lib/groq";
import { readValidatedImage } from "@/lib/image-validation";
import { parseFormDataLimited, RequestBodyError } from "@/lib/request-body";
import { COMPLAINT_CATEGORIES, getAuthorityForCategory } from "@/lib/complaint-options";

export const runtime = "nodejs";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    primaryFault: { type: ["string", "null"] },
    visibleEvidence: { type: ["string", "null"] },
    isUncertain: { type: "boolean" },
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    category: { type: ["string", "null"], enum: [...COMPLAINT_CATEGORIES, null] },
    asset: { type: ["string", "null"] },
    severity: { type: "integer", minimum: 1, maximum: 5 },
    priority: { type: "string", enum: PRIORITIES },
    safetyConcern: { type: "boolean" },
    confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
    reasoningSummary: { type: "string" },
  },
  required: ["primaryFault", "visibleEvidence", "isUncertain", "title", "description", "category", "asset", "severity", "priority", "safetyConcern", "confidence", "reasoningSummary"],
};

function boundedText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function uncertainAnalysis(reasoningSummary) {
  return {
    primaryFault: "",
    visibleEvidence: "",
    isUncertain: true,
    title: "",
    description: "",
    category: "",
    asset: "",
    severity: 3,
    priority: "Medium",
    safetyConcern: false,
    recommendedDepartment: "",
    confidence: null,
    reasoningSummary: boundedText(reasoningSummary, 280) || "The primary fault is unclear from this image. Please describe the issue manually.",
  };
}

function normalizeAnalysis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.isUncertain !== "boolean") return null;
  if (value.isUncertain) return uncertainAnalysis(value.reasoningSummary);

  const primaryFault = boundedText(value.primaryFault, 160);
  const visibleEvidence = boundedText(value.visibleEvidence, 280);
  const title = boundedText(value.title, 100);
  const description = boundedText(value.description, 500);
  const reasoningSummary = boundedText(value.reasoningSummary, 280);
  const category = COMPLAINT_CATEGORIES.includes(value.category) ? value.category : "";
  if (!primaryFault || !visibleEvidence || !title || !description || !reasoningSummary || !category) return null;
  if (!Number.isInteger(value.severity) || value.severity < 1 || value.severity > 5) return null;
  if (!PRIORITIES.includes(value.priority) || typeof value.safetyConcern !== "boolean") return null;
  if (!(typeof value.asset === "string" || value.asset === null)) return null;

  return {
    primaryFault,
    visibleEvidence,
    isUncertain: false,
    title,
    description,
    category,
    asset: boundedText(value.asset, 100),
    severity: value.severity,
    priority: value.priority,
    safetyConcern: value.safetyConcern,
    recommendedDepartment: getAuthorityForCategory(category),
    confidence: null,
    reasoningSummary,
  };
}

export async function POST(request) {
  const auth = await authenticateApiRequest(request, ["student", "department"]);
  if (auth.error) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });

  try {
    const formData = await parseFormDataLimited(request, 5 * 1024 * 1024 + 64 * 1024);
    const image = formData.get("file");
    const validated = await readValidatedImage(image);
    if (validated.error) return NextResponse.json({ message: validated.error }, { status: 400 });

    const imageUrl = `data:${validated.mimeType};base64,${validated.buffer.toString("base64")}`;
    const result = await requestGroqJson({
      maxTokens: 900,
      responseSchema: analysisSchema,
      messages: [
        {
          role: "system",
          content: "You triage campus maintenance photos. Identify one primary visible fault or damaged object, then cite specific visible evidence. Focus on the fault, not the whole scene; ignore unrelated desks, floor objects, furniture, people, and background clutter. Do not merely inventory objects. The title must name the suspected fault and affected object. The description must state its visible condition and request inspection or repair. Never infer damage from an ordinary object with no visible fault, or claim hidden electrical, structural, or safety conditions as facts. If the fault is ambiguous, obstructed, or not visibly identifiable, set isUncertain=true and set primaryFault, visibleEvidence, title, description, category, and asset to null; ask the student to describe it manually. Otherwise set isUncertain=false and provide non-empty primaryFault, visibleEvidence, title, description, reasoningSummary, and an existing category. Severity is an estimate from 1 (minor) to 5 (urgent); priority must be Low, Medium, High, or Critical. safetyConcern is only a cautious recommendation for human inspection, never confirmation of danger. Never invent a location. Return null for confidence because this service does not provide a calibrated confidence score.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze the uploaded image itself. Identify the primary visible fault and its evidence, separating it from unrelated background objects. Use only these category values: ${COMPLAINT_CATEGORIES.join(", ")}. If the primary fault is unclear, return an uncertain result and leave unsupported issue fields null. Do not treat the image as proof that a hazard is live or a structure is unsafe.` },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const analysis = normalizeAnalysis(result);
    if (!analysis) {
      return NextResponse.json({ message: "The AI could not produce a usable report. Please retry or enter the details manually." }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof GroqRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Complaint image analysis failed.", error?.name || "Unknown error");
    return NextResponse.json({ message: "Image analysis failed. Please retry or continue manually." }, { status: 500 });
  }
}
