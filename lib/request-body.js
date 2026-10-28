export class RequestBodyError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function readLimitedBody(request, maxBytes) {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new RequestBodyError("Invalid request size.", 400);
    }
    if (declaredLength > maxBytes) {
      throw new RequestBodyError("Request payload is too large.", 413);
    }
  }

  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError("Request payload is too large.", 413);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalBytes);
}

function replayRequest(request, body) {
  const contentType = request.headers.get("content-type");
  const headers = contentType ? { "content-type": contentType } : {};
  return new Request(request.url, { method: request.method, headers, body });
}

export async function parseFormDataLimited(request, maxBytes) {
  try {
    const body = await readLimitedBody(request, maxBytes);
    return await replayRequest(request, body).formData();
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError("Invalid multipart form data.", 400);
  }
}

export async function parseJsonLimited(request, maxBytes) {
  try {
    const body = await readLimitedBody(request, maxBytes);
    return JSON.parse(body.toString("utf8"));
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError("Invalid JSON request body.", 400);
  }
}
