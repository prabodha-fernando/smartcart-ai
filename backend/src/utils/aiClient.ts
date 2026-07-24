import { env } from "../config/env.js";

/**
 * Unified AI provider client.
 *
 * This is the ONE place in the codebase that talks to the NVIDIA NIM provider.
 * The model id, credentials, endpoint, and structural settings (temperature,
 * token limits, `response_format`) all live here, so callers only ever pass a
 * prompt. Keeping this centralized means system-level configuration never has
 * to be duplicated — and never leaks toward the client.
 *
 * Every call fails soft: on a missing key, a non-2xx response, or a timeout it
 * returns `null`, letting callers fall back to deterministic behavior.
 */

/** The single provider model used across all AI features. */
const AI_MODEL = "meta/llama-3.1-8b-instruct";

type ResponseFormat = "text" | "json_object";

interface CompletionOptions {
  maxTokens: number;
  temperature?: number;
  timeoutMs?: number;
  responseFormat?: ResponseFormat;
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Low-level provider call. Returns the raw assistant text, or null on failure.
 * When `responseFormat` is "json_object" the provider is instructed to emit
 * strict JSON via `response_format: { type: "json_object" }`.
 */
async function callModel(
  prompt: string,
  {
    maxTokens,
    temperature = 0.5,
    timeoutMs = 10_000,
    responseFormat = "text",
  }: CompletionOptions
): Promise<string | null> {
  if (!env.NVIDIA_NIM_API_KEY) return null;

  try {
    const response = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === "json_object"
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/** Free-form text completion. Returns trimmed text, or null on failure. */
export async function completeText(
  prompt: string,
  maxTokens: number,
  timeoutMs = 10_000
): Promise<string | null> {
  return callModel(prompt, {
    maxTokens,
    temperature: 0.5,
    timeoutMs,
    responseFormat: "text",
  });
}

/**
 * Strict-JSON completion. Uses `response_format: { type: "json_object" }` and
 * parses the result. Returns the parsed object, or null on any failure
 * (provider error, timeout, or unparseable content).
 */
export async function completeJson(
  prompt: string,
  maxTokens: number,
  timeoutMs = 5_000
): Promise<Record<string, unknown> | null> {
  const content = await callModel(prompt, {
    maxTokens,
    temperature: 0.2,
    timeoutMs,
    responseFormat: "json_object",
  });
  if (!content) return null;

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Streaming free-form text completion.
 * Yields parsed string chunks from the SSE stream.
 */
export async function* streamText(
  prompt: string,
  maxTokens: number,
  timeoutMs = 15_000
): AsyncGenerator<string, void, unknown> {
  if (!env.NVIDIA_NIM_API_KEY) return;

  try {
    const response = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok || !response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content;
            if (chunk) yield chunk;
          } catch {
            // Ignore parse errors on partial/malformed chunks
          }
        }
      }
    }
  } catch {
    // Fail soft on timeout or network error
  }
}

