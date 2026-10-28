export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_COMPLAINT_IMAGES = 3;
export const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function readValidatedImage(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size <= 0) {
    return { error: "Choose a non-empty image file." };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: "Each image must be 5 MB or smaller." };
  }
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { error: "Use a JPEG, PNG, or WebP image." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isJpeg = file.type === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = file.type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = file.type === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    return { error: "The image file contents do not match its file type." };
  }

  return { buffer, mimeType: file.type };
}
