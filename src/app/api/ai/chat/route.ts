import type { LimitedProduct } from "@/types/product";
import { resolveChat } from "@/services/chatService";

// Thin controller: the frontend sends ONLY the conversation (never the system
// prompt). All prompt building, the AI call, and product resolution live in the
// service / lib layer. This just parses the request and returns the result.

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    messages?: IncomingMessage[];
    lastProducts?: LimitedProduct[];
  };

  const messages = (body.messages ?? []).filter((m) => m?.content?.trim());
  const lastProducts = Array.isArray(body.lastProducts) ? body.lastProducts : [];

  const result = await resolveChat({ messages, lastProducts });

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
