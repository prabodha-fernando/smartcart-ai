import type { LimitedProduct } from "@/types/product";
import { resolveChat } from "@/services/chatService";


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
