// Central NVIDIA NIM client — the ONLY place in the app that talks to the AI
// API. Prompt text lives in promptBuilder.ts; product/business logic lives in
// the services. This avoids duplicated SDK logic and frontend leakage of the
// system rules.
//
// NVIDIA's NIM endpoint is OpenAI-compatible, so we drive it with the official
// OpenAI SDK, handing it our NVIDIA key as the OpenAI API key.

import type OpenAI from "openai";

// mistralai/mistral-large-3-675b-instruct-2512 returns 429 (rate limited) on
// every call on this account, so we run the reliable llama-3.1-8b instead.
export const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

export type NvidiaMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type NvidiaJsonResponse = Record<string, unknown>;

/**
 * Generic NVIDIA NIM AI caller
 * - Always returns parsed JSON
 * - Keeps prompt logic outside this function
 * - Enforces structured output with response_format
 * On failure returns { success: false, error, data: null } so callers can tell
 * a real response from an error.
 */
export const callNvidiaAI = async (params: {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<NvidiaJsonResponse> => {
  try {
    const completion = await backendCompletion({
      model: params.model,
      messages: [
        {
          role: "user",
          content: params.prompt,
        },
      ],
      temperature: params.temperature ?? 0.5,
      max_tokens: params.maxTokens ?? 1024,

      // IMPORTANT: enforce structured output when needed
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    return JSON.parse(content) as NvidiaJsonResponse;
  } catch (error) {
    console.error("NVIDIA AI Error:", error);

    return {
      success: false,
      error: "AI request failed",
      data: null,
    };
  }
};

// Streams a chat completion's text deltas to `onText`. Used for the product
// "why buy this" blurb (free-text, not the structured-JSON assistant). Returns
// true if anything was written.
export async function streamNvidiaChat(
  payload: {
    messages: NvidiaMessage[];
    temperature?: number;
    max_tokens?: number;
  },
  onText: (text: string) => void
): Promise<boolean> {
  const completion = await backendCompletion({
    model: NVIDIA_MODEL,
    ...payload,
  });
  const text = completion.choices?.[0]?.message?.content;
  if (!text) return false;
  onText(text);
  return true;
}

interface CompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

async function backendCompletion(payload: Record<string, unknown>): Promise<CompletionResponse> {
  const baseUrl = process.env.BACKEND_API_URL || "http://localhost:4000/api";
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/ai/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-proxy-secret": process.env.AI_PROXY_SECRET || "",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Backend AI proxy failed (${response.status})`);
  return response.json() as Promise<CompletionResponse>;
}
