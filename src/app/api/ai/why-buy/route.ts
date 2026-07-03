import { streamNvidiaChat } from "@/lib/nvidia";

// Streams a short, grounded "why buy this" pitch for a single product.
// Response body is raw text (streamed token-by-token) — no metadata frame.

interface WhyBuyProduct {
  title?: string;
  price?: number;
  rating?: number;
  description?: string;
  category?: string;
  brand?: string;
  stock?: number;
  discountPercentage?: number;
  tags?: string[];
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
}

const SYSTEM =
  "You are SmartCart AI, a shopping assistant. In 2-3 short sentences, tell the shopper why this product is a good buy, using ONLY the facts provided. " +
  "Be specific and honest — highlight the rating, price, discount, warranty, or shipping when they stand out. " +
  "Warm and confident, second person ('you'), no markdown, no bullet points, and never invent specs or numbers that aren't given.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    product?: WhyBuyProduct;
  };
  const product = body.product ?? {};
  const apiKey = process.env.NVIDIA_API_KEY;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      if (apiKey) {
        try {
          const wrote = await streamNvidiaChat(
            {
              temperature: 0.6,
              max_tokens: 160,
              messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content: buildFacts(product) },
              ],
            },
            apiKey,
            send
          );

          if (wrote) {
            controller.close();
            return;
          }
        } catch {
          // fall through to deterministic fallback
        }
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

function buildFacts(product: WhyBuyProduct): string {
  const facts: string[] = [];

  if (product.title) facts.push(`Product: ${product.title}`);
  if (product.category) facts.push(`Category: ${product.category}`);
  if (product.brand) facts.push(`Brand: ${product.brand}`);
  if (typeof product.price === "number") facts.push(`Price: $${product.price}`);
  if (typeof product.discountPercentage === "number")
    facts.push(`Discount: ${Math.round(product.discountPercentage)}% off`);
  if (typeof product.rating === "number")
    facts.push(`Rating: ${product.rating}/5`);
  if (typeof product.stock === "number") facts.push(`Stock: ${product.stock}`);
  if (product.availabilityStatus)
    facts.push(`Availability: ${product.availabilityStatus}`);
  if (product.warrantyInformation)
    facts.push(`Warranty: ${product.warrantyInformation}`);
  if (product.shippingInformation)
    facts.push(`Shipping: ${product.shippingInformation}`);
  if (product.tags?.length) facts.push(`Tags: ${product.tags.join(", ")}`);
  if (product.description) facts.push(`Description: ${product.description}`);

  return facts.join("\n");
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
