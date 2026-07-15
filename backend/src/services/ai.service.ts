import { env } from "../config/env.js";
import { dummyjson } from "./product.service.js";
import type { AiChatInput, WhyBuyInput } from "../validators/ai.validator.js";

interface CatalogProduct {
  id: number; title: string; price: number; rating: number; thumbnail: string;
  category?: string; description?: string;
}

interface ShoppingDecision {
  intent: "greeting" | "gratitude" | "product_search" | "product_question" | "app_question" | "out_of_scope";
  requiresProducts: boolean;
  reply: string;
}

const categoryTerms: Record<string, string> = {
  phone: "smartphones", smartphone: "smartphones", laptop: "laptops",
  perfume: "fragrances", makeup: "beauty", mascara: "beauty",
  furniture: "furniture", grocery: "groceries", food: "groceries",
  dress: "womens-dresses", shoes: "mens-shoes", watch: "mens-watches",
  bag: "womens-bags", tablet: "tablets", skincare: "skin-care",
};

const needCategoryRules: Array<{ test: RegExp; categories: string[] }> = [
  {
    test: /\b(gamer|gaming|video game|streamer|streaming setup)\b/i,
    categories: ["laptops", "mobile-accessories", "tablets"],
  },
  {
    test: /\b(wedding|bridal|bridesmaid|elegant.*(?:wear|outfit|dress))\b/i,
    categories: ["womens-dresses"],
  },
  {
    test: /\b(university|college|student|studying|campus)\b/i,
    categories: ["laptops", "tablets", "womens-bags"],
  },
  {
    test: /\b(noise[- ]?cancell?ing|headphones?|headsets?|earbuds?|earphones?)\b/i,
    categories: ["mobile-accessories"],
  },
  {
    test: /\b(home office|workspace|desk setup|work from home)\b/i,
    categories: ["furniture", "laptops", "mobile-accessories"],
  },
  {
    test: /\b(dinner|meal|cook|cooking|ingredient|meat|snack|food)\b/i,
    categories: ["groceries"],
  },
];

export async function resolveAiChat(input: AiChatInput) {
  const latest = [...input.messages].reverse().find((message) => message.role === "user")!.content;
  const decision = await getShoppingDecision(input);
  if (!decision.requiresProducts) {
    if (decision.intent === "product_question" && input.lastProducts.length > 0) {
      const reply = await groundedReply(latest, input.lastProducts);
      return { reply, products: [], intent: decision.intent, isNewSearch: false };
    }
    return { reply: decision.reply, products: [], intent: decision.intent, isNewSearch: false };
  }

  if (isShownProductQuestion(latest) && input.lastProducts.length > 0) {
    const reply = await groundedReply(latest, input.lastProducts);
    return { reply, products: [], intent: "product_question", isNewSearch: false };
  }

  const searchText = buildSearchText(input.messages);
  const products = await findProducts(searchText, input.messages);
  const reply = products.length
    ? await groundedReply(latest, products)
    : "I couldn't find a matching product right now. Try another product name, category, or budget.";
  return { reply, products, intent: decision.intent, isNewSearch: products.length > 0 };
}

async function getShoppingDecision(input: AiChatInput): Promise<ShoppingDecision> {
  const latest = [...input.messages].reverse().find((message) => message.role === "user")!.content.trim();
  const lower = latest.toLowerCase();
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return { intent: "greeting", requiresProducts: false, reply: "Hello! What are you shopping for today?" };
  }
  if (/^(thanks|thank you|thankyou|cheers)\b/.test(lower)) {
    return { intent: "gratitude", requiresProducts: false, reply: "You're welcome! Let me know if you'd like help finding anything else." };
  }
  if (/\b(worth|which is better|is (it|this|that) good|tell me about (it|this|that)|should i buy)\b/.test(lower) && input.lastProducts.length > 0) {
    return { intent: "product_question", requiresProducts: false, reply: "" };
  }
  if (/\b(weather|news|homework|write code|politics|medical advice)\b/.test(lower)) {
    return { intent: "out_of_scope", requiresProducts: false, reply: "I’m here to help with shopping and product decisions. What would you like to find?" };
  }

  const transcript = input.messages.slice(-8).map((message) => `${message.role}: ${message.content}`).join("\n");
  const raw = await completeJson(
    `Classify the latest shopping conversation. Return only JSON with intent, requiresProducts, and reply. ` +
    `Allowed intents: product_search, product_question, app_question, out_of_scope. Product requests, gifts, occasions, budgets, and broad needs require products.\n${transcript}`,
    180
  );
  const intent = raw && typeof raw.intent === "string" && ["product_search", "product_question", "app_question", "out_of_scope"].includes(raw.intent)
    ? raw.intent as ShoppingDecision["intent"]
    : "product_search";
  return {
    intent,
    requiresProducts: raw?.requiresProducts !== false && intent === "product_search",
    reply: typeof raw?.reply === "string" && raw.reply.trim() ? raw.reply.trim() : "Let me find the best matches in our catalog.",
  };
}

export async function resolveWhyBuy(input: WhyBuyInput) {
  const product = input.product;
  const facts = Object.entries(product)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");
  const prompt = `Using only these facts, explain in 2-3 short, honest sentences why this product may be a good buy. No markdown or invented claims.\n${facts}`;
  return (await completeText(prompt, 180)) || fallbackWhyBuy(product);
}

async function findProducts(text: string, messages: AiChatInput["messages"]) {
  const lower = text.toLowerCase();
  const needCategories = needCategoryRules.find((rule) => rule.test.test(lower))?.categories;
  const directCategory = Object.entries(categoryTerms).find(([term]) => new RegExp(`\\b${term}s?\\b`).test(lower))?.[1];
  const categories = needCategories ?? (directCategory ? [directCategory] : []);
  const query = extractQuery(lower);
  let products: CatalogProduct[];
  if (categories.length > 0) {
    const responses = await Promise.all(
      categories.map((category) =>
        dummyjson.get(`/products/category/${category}`, { params: { limit: 100 } })
      )
    );
    products = responses.flatMap(({ data }) => (data.products ?? []) as CatalogProduct[]);
  } else {
    const { data } = await dummyjson.get("/products/search", {
      params: { q: query, limit: 100 },
    });
    products = (data.products ?? []) as CatalogProduct[];
  }
  products = applyNeedRelevance(products, lower);
  const under = lower.match(/(?:under|below|up to|less than)\s*\$?(\d+)/);
  const over = lower.match(/(?:over|above|at least|more than)\s*\$?(\d+)/);
  const between = lower.match(/between\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/);
  if (between) products = products.filter((p) => p.price >= Number(between[1]) && p.price <= Number(between[2]));
  if (under) products = products.filter((p) => p.price <= Number(under[1]));
  if (over) products = products.filter((p) => p.price >= Number(over[1]));
  if (/cheapest|lowest price|affordable/.test(lower)) products.sort((a, b) => a.price - b.price);
  else if (/most expensive|premium|highest price/.test(lower)) products.sort((a, b) => b.price - a.price);
  else products.sort((a, b) => relevanceScore(b, lower) - relevanceScore(a, lower) || b.rating - a.rating);
  const rating = lower.match(/(?:at least|minimum|min|above|over)?\s*(\d(?:\.\d)?)\s*(?:star|stars|rated)/);
  if (rating) products = products.filter((product) => product.rating >= Number(rating[1]));
  const limit = /\b(one|single|1)\b/.test(lower) ? 1 : 4;
  const shortlist = products.slice(0, 20);
  const selected = await selectProductsWithAI(shortlist, messages, limit);
  return selected.map(({ id, title, price, rating, thumbnail }) => ({ id, title, price, rating, thumbnail }));
}

async function selectProductsWithAI(products: CatalogProduct[], messages: AiChatInput["messages"], limit: number) {
  if (products.length <= limit) return products;
  const catalog = products.map((product) => `${product.id}: ${product.title}, $${product.price}, ${product.rating}/5, ${product.category ?? ""}`).join("\n");
  const request = messages.slice(-4).map((message) => `${message.role}: ${message.content}`).join("\n");
  const raw = await completeJson(
    `Choose up to ${limit} relevant product IDs from this real catalog. Respect product type, budget, rating, occasion, and use case. Return only {"productIds":[1,2]}.\nREQUEST\n${request}\nCATALOG\n${catalog}`,
    140
  );
  const ids = Array.isArray(raw?.productIds) ? raw.productIds.filter((id): id is number => typeof id === "number") : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const chosen = ids.map((id) => byId.get(id)).filter((product): product is CatalogProduct => Boolean(product)).slice(0, limit);
  return chosen.length > 0 ? chosen : products.slice(0, limit);
}

function applyNeedRelevance(products: CatalogProduct[], request: string) {
  const rules: Array<{ test: RegExp; product: RegExp }> = [
    {
      test: /\b(noise[- ]?cancell?ing|headphones?|headsets?|earbuds?|earphones?)\b/,
      product: /\b(headphones?|headsets?|earbuds?|earphones?|airpods?|beats)\b/i,
    },
    {
      test: /\b(wedding|bridal|bridesmaid|elegant.*(?:wear|outfit|dress))\b/,
      product: /\b(dress|gown|suit|skirt)\b/i,
    },
  ];
  const rule = rules.find(({ test }) => test.test(request));
  if (!rule) return products;
  const relevant = products.filter((product) =>
    rule.product.test(`${product.title} ${product.description ?? ""}`)
  );
  return relevant.length > 0 ? relevant : products;
}

function relevanceScore(product: CatalogProduct, request: string) {
  let score = product.rating;
  const category = product.category ?? "";
  if (/\b(gamer|gaming|streamer)\b/.test(request)) {
    if (category === "laptops") score += 6;
    else if (category === "tablets") score += 3;
    else if (category === "mobile-accessories") score += 2;
  }
  if (/\b(university|college|student)\b/.test(request)) {
    if (category === "laptops") score += 6;
    else if (category === "tablets") score += 4;
  }
  if (/\b(wedding|bridal|elegant)\b/.test(request) && category === "womens-dresses") score += 8;
  return score;
}

async function groundedReply(question: string, products: Array<{ title: string; price: number; rating: number }>) {
  const facts = products.map((p) => `${p.title}: $${p.price}, ${p.rating}/5`).join("\n");
  return (await completeText(`Answer the shopper warmly in 1-2 sentences using only these products.\nQuestion: ${question}\n${facts}`, 160))
    || `I found ${products.length === 1 ? products[0]!.title : "some strong matches"} based on your request.`;
}

async function completeText(prompt: string, maxTokens: number) {
  if (!env.NVIDIA_NIM_API_KEY) return null;
  try {
    const response = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: prompt }], temperature: 0.5, max_tokens: maxTokens }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function completeJson(prompt: string, maxTokens: number): Promise<Record<string, unknown> | null> {
  if (!env.NVIDIA_NIM_API_KEY) return null;
  try {
    const response = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    return content ? JSON.parse(content) as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function buildSearchText(messages: AiChatInput["messages"]) {
  const userMessages = messages.filter((message) => message.role === "user").map((message) => message.content);
  const latest = userMessages.at(-1) ?? "";
  const isConstraintFollowUp = /^(under|below|over|above|between|cheapest|premium|best rated|make it|only|one|single)\b/i.test(latest.trim());
  if (!isConstraintFollowUp || userMessages.length < 2) return latest;
  return `${userMessages.at(-2)} ${latest}`;
}

function extractQuery(text: string) {
  return text.replace(/\b(show|find|recommend|suggest|give|me|products?|items?|under|below|over|above|cheapest|best|rated|please)\b/g, " ").replace(/\$?\d+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "products";
}
function isShownProductQuestion(text: string) { return /\b(worth|which|better|good|tell me about|this|that|these)\b/i.test(text); }
function fallbackWhyBuy(product: WhyBuyInput["product"]) { return `${product.title ?? "This product"} is worth considering${typeof product.rating === "number" ? ` with a ${product.rating.toFixed(1)}/5 rating` : ""}${typeof product.price === "number" ? ` at $${product.price.toFixed(2)}` : ""}.`; }
