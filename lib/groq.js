const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class GroqRequestError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

export async function requestGroqJson({ messages, responseSchema, maxTokens = 1200 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqRequestError("AI analysis is not configured. You can still complete this form manually.", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: {
          type: "json_schema",
          json_schema: { name: "raiseit_response", strict: true, schema: responseSchema },
        },
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new GroqRequestError("The AI service is busy. Please wait a moment and retry.", 503);
      }
      if (response.status >= 500) {
        throw new GroqRequestError("The AI service is temporarily unavailable. Please retry or continue manually.", 503);
      }
      throw new GroqRequestError("The AI service rejected this request. Please retry or continue manually.", 502);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new GroqRequestError("The AI service returned an empty response. Please retry.", 502);
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new GroqRequestError("The AI service returned an unreadable response. Please retry.", 502);
    }
  } catch (error) {
    if (error instanceof GroqRequestError) throw error;
    if (error?.name === "AbortError") {
      throw new GroqRequestError("AI analysis timed out. Please retry or continue manually.", 504);
    }
    throw new GroqRequestError("Could not reach the AI service. Please retry or continue manually.", 503);
  } finally {
    clearTimeout(timeout);
  }
}
