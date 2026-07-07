import { streamNvidiaChat } from "@/lib/ai/nvidiaClient";
import { buildWhyBuyPrompt, type WhyBuyProduct } from "@/lib/ai/promptBuilder";

// Streams a short, grounded "why buy this" pitch for a single product.
// Response body is raw text (streamed token-by-token) — no metadata frame.
// This is a free-text blurb, not the structured-JSON shopping assistant, so it
// streams prose. Prompt text lives in promptBuilder; the client call lives in
// nvidiaClient.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    product?: WhyBuyProduct;
  };
  const product = body.product ?? {};
  const { system, facts } = buildWhyBuyPrompt(product);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      try {
        const wrote = await streamNvidiaChat(
          {
            temperature: 0.6,
            max_tokens: 160,
            messages: [
              { role: "system", content: system },
              { role: "user", content: facts },
            ],
          },
          send
        );

        if (wrote) {
          controller.close();
          return;
        }
      } catch {
        // fall through to deterministic fallback
      }

      send(fallbackPitch(product));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Deterministic pitch used when the model is unavailable.
function fallbackPitch(product: WhyBuyProduct): string {
  const name = product.title ?? "This product";
  const parts: string[] = [];

  if (typeof product.rating === "number" && product.rating >= 4) {
    parts.push(`it's highly rated at ${product.rating.toFixed(1)}/5`);
  } else if (typeof product.rating === "number") {
    parts.push(`it holds a ${product.rating.toFixed(1)}/5 rating`);
  }

  if (typeof product.discountPercentage === "number" && product.discountPercentage >= 1) {
    parts.push(`it's currently ${Math.round(product.discountPercentage)}% off`);
  } else if (typeof product.price === "number") {
    parts.push(`it's priced at $${product.price.toFixed(2)}`);
  }

  if (product.warrantyInformation) {
    parts.push(`and comes with ${product.warrantyInformation.toLowerCase()}`);
  }

  if (parts.length === 0) {
    return `${name} is a solid pick worth adding to your cart.`;
  }

  return `${name} is a great choice — ${parts.join(", ")}.`;
}
