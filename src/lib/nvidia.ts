// Shared NVIDIA NIM helpers used by the AI route handlers.

export const NVIDIA_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";

// The 70B model times out on the current account, so we run the reliable 8B.
export const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

export interface NvidiaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Streams an NVIDIA chat completion, forwarding only the text deltas to
// `onText`. Returns true if any content was written, false if the request
// failed (so callers can fall back to a deterministic response).
export async function streamNvidiaChat(
  payload: {
    messages: NvidiaMessage[];
    temperature?: number;
    max_tokens?: number;
  },
  apiKey: string,
  onText: (text: string) => void
): Promise<boolean> {
  const response = await fetch(NVIDIA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      stream: true,
      ...payload,
    }),
  });

  if (!response.ok || !response.body) {
    return false;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let wrote = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (data === "[DONE]" || !data) continue;

      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json.choices?.[0]?.delta?.content;
        if (delta) {
          onText(delta);
          wrote = true;
        }
      } catch {
        // ignore malformed SSE fragments
      }
    }
  }

  return wrote;
}
