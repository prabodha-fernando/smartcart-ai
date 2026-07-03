import type { AIQueryPlan, LimitedProduct, Product } from "@/types/product";
import { NVIDIA_MODEL, NVIDIA_URL, streamNvidiaChat } from "@/lib/nvidia";

// Streaming shopping assistant.
//
// Response protocol (single HTTP stream):
//   1. One line of JSON metadata (an AIChatMeta), terminated by "\n".
//   2. The assistant's prose, streamed token-by-token as raw text.
// The client parses everything up to the first newline as the metadata frame,
// then treats the remainder as the streamed reply.

const categories = [
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
  "home-decoration",
  "kitchen-accessories",
  "laptops",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "mobile-accessories",
  "motorcycle",
  "skin-care",
  "smartphones",
  "sports-accessories",
  "sunglasses",
  "tablets",
  "tops",
  "vehicle",
  "womens-bags",
  "womens-dresses",
  "womens-jewellery",
  "womens-shoes",
  "womens-watches",
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dummyjson.com";
const MAX_PRODUCTS = 4;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

const PLAN_SYSTEM =
  "You convert a shopping conversation into a product search plan. " +
  'Respond with ONLY valid minified JSON, no markdown, matching this schema: {"search": boolean, "category": string|null, "maxPrice": number|null, "minRating": number|null, "keywords": string[]}. ' +
  "Set search to false ONLY when the latest user message is a follow-up about products already discussed (comparing them, asking for more detail) and needs no new catalog search; otherwise set search to true. " +
  "category MUST be exactly one of [" +
  categories.join(", ") +
  "] or null. Only set category when the requested product type clearly maps to one of those values; if the request is loose or no category fits well (for example a gift, or 'something for a gamer'), set category to null and rely on keywords instead of guessing a related category. " +
  "keywords: up to 5 short salient search terms from the request. " +
  "maxPrice and minRating: numbers only when the shopper implies a budget or quality bar, otherwise null.";

const REPLY_SYSTEM =
  "You are SmartCart AI, a friendly and concise shopping assistant for an online store. " +
  "Recommend only from the candidate products provided to you. Refer to products by name, " +
  "mention price and rating when helpful, and briefly explain why each fits the shopper's need. " +
  "Keep replies to 2-4 sentences, conversational and warm, with no markdown, headings, or bullet lists. " +
  "If no candidate products are provided, apologise and suggest how to refine the search. " +
  "Never invent products, prices, or ratings that are not in the candidate list.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    messages?: IncomingMessage[];
    lastProducts?: LimitedProduct[];
  };

  const messages = (body.messages ?? []).filter((m) => m?.content?.trim());
  const lastProducts = Array.isArray(body.lastProducts) ? body.lastProducts : [];
  const apiKey = process.env.NVIDIA_API_KEY;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      const lastUser = [...messages].reverse().find((m) => m.role === "user");

      if (!lastUser) {
        send(JSON.stringify(emptyMeta()) + "\n");
        send("Tell me what you're shopping for and I'll find the best picks for you.");
        controller.close();
        return;
      }

      // 1. Turn the conversation into a search plan.
      const plan = await planQuery(messages, apiKey);

      // 2. Resolve the candidate products (fresh search, or reuse what's on screen).
      const isNewSearch = plan.search || lastProducts.length === 0;
      const products = isNewSearch
        ? await fetchProducts(plan)
        : lastProducts.slice(0, MAX_PRODUCTS);

      // 3. Emit the metadata frame.
      send(JSON.stringify({ query: plan, products, isNewSearch }) + "\n");

      // 4. Stream the natural-language reply.
      await streamReply({ messages, products, apiKey, send });

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

function emptyMeta() {
  return {
    query: {
      search: false,
      category: null,
      maxPrice: null,
      minRating: null,
      keywords: [],
    } satisfies AIQueryPlan,
    products: [] as LimitedProduct[],
    isNewSearch: false,
  };
}

async function planQuery(
  messages: IncomingMessage[],
  apiKey?: string
): Promise<AIQueryPlan> {
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (!apiKey) {
    return fallbackPlan(lastUser);
  }

  try {
    const response = await fetch(NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        temperature: 0.1,
        max_tokens: 160,
        messages: [
          { role: "system", content: PLAN_SYSTEM },
          ...messages.slice(-6),
        ],
      }),
    });

    if (!response.ok) {
      return fallbackPlan(lastUser);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    return normalizePlan(parseJsonObject(content));
  } catch {
    return fallbackPlan(lastUser);
  }
}

// Retrieves candidate products, broadening the strategy until something within
// the shopper's budget is found: category first, then a keyword search, then a
// general listing. Keeps mediocre plans from returning an empty grid.
async function fetchProducts(plan: AIQueryPlan): Promise<LimitedProduct[]> {
  const strategies: string[] = [];

  if (plan.category) {
    strategies.push(`${BASE_URL}/products/category/${plan.category}?limit=100`);
  }
  if (plan.keywords.length > 0) {
    strategies.push(
      `${BASE_URL}/products/search?q=${encodeURIComponent(
        plan.keywords.join(" ")
      )}&limit=100`
    );
  }
  strategies.push(`${BASE_URL}/products?limit=100`);

  for (const url of strategies) {
    const products = await fetchPool(url, plan);
    if (products.length > 0) {
      return products;
    }
  }

  return [];
}

async function fetchPool(
  url: string,
  plan: AIQueryPlan
): Promise<LimitedProduct[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { products?: Product[] };

    return (data.products ?? [])
      .filter((p) =>
        typeof plan.maxPrice === "number" ? p.price <= plan.maxPrice : true
      )
      .filter((p) =>
        typeof plan.minRating === "number" ? p.rating >= plan.minRating : true
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, MAX_PRODUCTS)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        rating: p.rating,
        thumbnail: p.thumbnail,
      }));
  } catch {
    return [];
  }
}

async function streamReply({
  messages,
  products,
  apiKey,
  send,
}: {
  messages: IncomingMessage[];
  products: LimitedProduct[];
  apiKey?: string;
  send: (text: string) => void;
}) {
  // With no candidates the model tends to invent products, so answer
  // deterministically instead of prompting it to free-write.
  if (products.length === 0) {
    send(fallbackReply(products));
    return;
  }

  const productContext = products
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} — $${p.price}, rating ${p.rating.toFixed(1)}/5`
    )
    .join("\n");

  if (apiKey) {
    try {
      const wrote = await streamNvidiaChat(
        {
          temperature: 0.6,
          max_tokens: 260,
          messages: [
            { role: "system", content: REPLY_SYSTEM },
            { role: "system", content: `Candidate products:\n${productContext}` },
            ...messages.slice(-6),
          ],
        },
        apiKey,
        send
      );

      if (wrote) {
        return;
      }
    } catch {
      // fall through to the local fallback below
    }
  }

  send(fallbackReply(products));
}

function normalizePlan(value: Partial<AIQueryPlan> | null): AIQueryPlan {
  return {
    search: typeof value?.search === "boolean" ? value.search : true,
    category:
      value?.category && categories.includes(value.category)
        ? value.category
        : null,
    maxPrice:
      typeof value?.maxPrice === "number" && Number.isFinite(value.maxPrice)
        ? value.maxPrice
        : null,
    minRating:
      typeof value?.minRating === "number" && Number.isFinite(value.minRating)
        ? value.minRating
        : null,
    keywords: Array.isArray(value?.keywords)
      ? value.keywords
          .filter((k): k is string => typeof k === "string")
          .slice(0, 5)
      : [],
  };
}

// Pulls the first {...} block out of a model response and parses it, tolerating
// stray prose or markdown fences the model might add.
function parseJsonObject(content: string): Partial<AIQueryPlan> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Keyword-based plan used when the model is unavailable.
function fallbackPlan(prompt: string): AIQueryPlan {
  const lower = prompt.toLowerCase();

  const category =
    categories.find((item) => lower.includes(item.replace("-", " "))) ||
    (lower.includes("phone")
      ? "smartphones"
      : lower.includes("laptop") || lower.includes("programming")
      ? "laptops"
      : lower.includes("gift") || lower.includes("gamer")
      ? "sports-accessories"
      : null);

  const priceMatch = lower.match(/\$?(\d{2,5})/);

  return {
    search: true,
    category,
    maxPrice: priceMatch ? Number(priceMatch[1]) : null,
    minRating: lower.includes("best") || lower.includes("top") ? 4 : null,
    keywords: lower
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .slice(0, 5),
  };
}

// Deterministic reply used when the model can't generate one.
function fallbackReply(products: LimitedProduct[]): string {
  if (products.length === 0) {
    return "I couldn't find products matching that just yet. Try broadening your search — a different category, a higher budget, or fewer specifics.";
  }

  const top = products[0];
  const count = products.length;

  return `Here ${count === 1 ? "is a" : `are ${count}`} solid option${
    count === 1 ? "" : "s"
  } for you. ${top.title} stands out at $${top.price.toFixed(
    2
  )} with a ${top.rating.toFixed(
    1
  )}/5 rating — take a look at the picks below.`;
}
