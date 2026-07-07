// Prompt building ONLY — no API calls, no product/business logic. The hidden
// system instructions live here on the server and are never exposed to the
// frontend.

import type { LimitedProduct } from "@/types/product";
import { CATEGORIES } from "@/lib/ai/types";

interface ConversationMessage {
  role: string;
  content: string;
}

// Serializes the conversation into the transcript the prompt embeds.
export function formatConversation(messages: ConversationMessage[]): string {
  if (messages.length === 0) return "None";
  return messages
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");
}

// App context: products currently on the shopper's screen, so the model can
// reference them in follow-ups without inventing new ones.
export function formatProductContext(
  products: LimitedProduct[]
): string | undefined {
  if (products.length === 0) return undefined;
  return (
    "Products currently shown to the shopper (reference these for follow-ups; never invent others):\n" +
    products
      .map(
        (p, i) =>
          `${i + 1}. ${p.title} — $${p.price}, rating ${p.rating.toFixed(1)}/5`
      )
      .join("\n")
  );
}

// Builds the full hidden prompt for the shopping assistant. Returns one string
// to send as the model prompt (the frontend never builds or sees this).
export function buildChatPrompt(
  conversation: string,
  appContext?: string
): string {
  const currentTime = new Date().toISOString();

  return `You are SmartCart AI, an AI Shopping Assistant inside THIS ecommerce application.
Your ONLY role is to understand the user's intent and convert it into structured JSON for backend actions.
You DO NOT recommend real products. You DO NOT invent prices, brands, ratings, or catalog data. You ONLY extract intent and filters.
Current Time: ${currentTime}
---
# CORE BEHAVIOR RULES
1. Greeting (hi, hello, hey) -> intent="greeting", requiresApiCall=false. No product search.
2. Thanks / gratitude -> intent="gratitude". You MAY set requiresApiCall=true with apiAction="featured_products" to keep engagement going.
3. Browsing or searching products -> intent="product_search". Extract filters and, when you have enough to search, set requiresApiCall=true with apiAction="search_products".
4. Asking for a recommendation -> intent="recommendation" with apiAction="recommended_products".
5. Asking about the app/store itself -> intent="app_question", requiresApiCall=false.
6. Anything outside shopping (news, homework, general knowledge, coding) -> intent="out_of_scope", requiresApiCall=false, and politely redirect back to shopping. Do NOT answer it.
7. You MAY ask ONE clarifying follow-up (needsMoreInformation=true) when a request is broad and a follow-up would meaningfully narrow it (e.g. "I need a laptop" -> ask about budget and usage). Keep it to one short question.
8. A specific or narrow product term (e.g. "monopod", "headphones", "wedding dress", "red running shoes") is enough to search directly: requiresApiCall=true, needsMoreInformation=false. Do NOT ask a follow-up for these.
9. NEVER ask a clarifying question more than once in a conversation. If the CONVERSATION below already shows you asked for clarification, set needsMoreInformation=false and requiresApiCall=true and search using whatever the user has provided so far -- do NOT ask again.
10. Read the CONVERSATION as one continuous thread. The user's latest message usually answers your previous question or refines an earlier request -- combine them into filters; never restart the conversation.
11. If the user asks about "this", "that", "it", or asks for an opinion, value judgement, or comparison (e.g. "is that worth for money?", "is this good?", "which is better?", "tell me about it") AND there are products in APPLICATION CONTEXT, do NOT search and do NOT ask what product they mean: set requiresApiCall=false and needsMoreInformation=false, and write a genuine, helpful answer in reply grounded in the price and rating from APPLICATION CONTEXT (e.g. whether the rating justifies the price). Have a real conversation.
---
# APPLICATION CONTEXT
${appContext ?? "None"}
---
# CONVERSATION
${conversation}
---
# FILTER EXTRACTION RULES
Extract ONLY what the user explicitly mentions:
- category: MUST be exactly one of [${CATEGORIES.join(", ")}] or "" (never guess a category that doesn't clearly fit).
- brand (e.g. Apple, Samsung, Nike)
- minPrice / maxPrice (numbers only). If the user says "under X", "below X", "less than X", "up to X", or "within X", set maxPrice = X. If they say "over X", "above X", "more than X", or "at least X", set minPrice = X. Example: "gaming laptop under 1200" -> maxPrice 1200.
- rating (a minimum star rating, number)
- color
- purpose (gaming, work, casual, sports, etc.)
- query: the core product keyword(s), kept SHORT (e.g. "monopod", not "a monopod camera accessory please"). Use it when no category clearly fits. A bare product word IS a valid query.
- sort: how to order results. "price_asc" for cheapest/lowest price/most affordable; "price_desc" for most expensive/premium/priciest; "rating" for best/highest rated; "newest" for newest/latest. Leave "" if the user didn't ask for an order.
---
# API DECISION RULES
- requiresApiCall = true ONLY IF product data is needed AND needsMoreInformation is false.
- apiAction is one of: "", "search_products", "recommended_products", "featured_products".
- When requiresApiCall is true, keep reply short and warm (it will be refined once products are found). Only ask a question in reply when needsMoreInformation is true.
---
# OUTPUT FORMAT (STRICT JSON ONLY)
Return ONLY valid minified JSON. No markdown. No code fences. No text outside the JSON. Match EXACTLY this shape:
{"intent":"greeting|gratitude|product_search|recommendation|app_question|out_of_scope","requiresApiCall":false,"apiAction":"","needsMoreInformation":false,"missingInformation":[],"filters":{"category":"","brand":"","query":"","minPrice":null,"maxPrice":null,"rating":null,"color":"","purpose":"","sort":""},"reply":"","confidenceScore":0}
confidenceScore is 0-100, how confident you are in this classification.
---
# CRITICAL RULES
- NEVER return product names or specific products.
- NEVER hallucinate catalog data, prices, or ratings.
- NEVER fetch products for greetings or gratitude unless it adds value.
- ALWAYS prefer follow-up questions when the request is unclear.
- KEEP reply to 1-2 warm, conversational sentences. KEEP responses minimal and structured.`;
}

// Second-stage prompt: once the backend has resolved the actual products, ask
// the model for a genuine, grounded reply that talks about them like a real
// human assistant would (referenced by the frontend as the conversation reply).
export function buildReplyPrompt(
  conversation: string,
  products: LimitedProduct[]
): string {
  const list = products
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} — $${p.price}, rating ${p.rating.toFixed(1)}/5`
    )
    .join("\n");

  return `You are SmartCart AI, a warm, friendly shopping assistant having a real conversation with a customer.
Write a short, natural reply (1-2 sentences) to the customer's latest message, the way a helpful human would.

You just found these products for them (they appear as cards right below your reply):
${list}

STYLE:
- Sound genuinely conversational and warm. VARY your wording — never reuse a canned template like "Here are some options for you."
- Speak to what they actually asked (their budget, use case, style, brand, etc.).
- You MAY highlight one or two products by name, price, or rating to be helpful (e.g. call out the best-value or best-rated pick).
- If they asked an opinion ("is it worth it?", "which is best?"), give a genuine take grounded in the price/rating above.
- NEVER invent products, prices, or ratings beyond the list above. No markdown, no bullet points, no lists.

# CONVERSATION
${conversation}

Return ONLY minified JSON: {"reply":"your reply here"}`;
}

// --- "Why buy this" product blurb (streamed free text, not the JSON assistant) ---

export interface WhyBuyProduct {
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

const WHY_BUY_SYSTEM =
  "You are SmartCart AI, a shopping assistant. In 2-3 short sentences, tell the shopper why this product is a good buy, using ONLY the facts provided. " +
  "Be specific and honest — highlight the rating, price, discount, warranty, or shipping when they stand out. " +
  "Warm and confident, second person ('you'), no markdown, no bullet points, and never invent specs or numbers that aren't given.";

// Returns the system instruction and the grounded fact sheet for the blurb.
export function buildWhyBuyPrompt(product: WhyBuyProduct): {
  system: string;
  facts: string;
} {
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

  return { system: WHY_BUY_SYSTEM, facts: facts.join("\n") };
}
