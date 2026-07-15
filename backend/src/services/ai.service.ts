import { env } from "../config/env.js";
import { dummyjson } from "./product.service.js";
import type { AiChatInput, WhyBuyInput } from "../validators/ai.validator.js";

interface CatalogProduct {
  id: number; title: string; price: number; rating: number; thumbnail: string;
  category?: string; description?: string;
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
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(latest)) {
    return { reply: "Hello! What are you shopping for today?", products: [], intent: "greeting", isNewSearch: false };
  }

  if (isShownProductQuestion(latest) && input.lastProducts.length > 0) {
    const reply = await groundedReply(latest, input.lastProducts);
    return { reply, products: [], intent: "product_question", isNewSearch: false };
  }

  const products = await findProducts(latest);
  const reply = products.length
    ? await groundedReply(latest, products)
    : "I couldn't find a matching product right now. Try another product name, category, or budget.";
  return { reply, products, intent: "product_search", isNewSearch: products.length > 0 };
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

async function findProducts(text: string) {
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
  if (under) products = products.filter((p) => p.price <= Number(under[1]));
  if (over) products = products.filter((p) => p.price >= Number(over[1]));
  if (/cheapest|lowest price|affordable/.test(lower)) products.sort((a, b) => a.price - b.price);
  else if (/most expensive|premium|highest price/.test(lower)) products.sort((a, b) => b.price - a.price);
  else products.sort((a, b) => relevanceScore(b, lower) - relevanceScore(a, lower) || b.rating - a.rating);
  const limit = /\b(one|single|1)\b/.test(lower) ? 1 : 4;
  return products.slice(0, limit).map(({ id, title, price, rating, thumbnail }) => ({ id, title, price, rating, thumbnail }));
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

function extractQuery(text: string) {
  return text.replace(/\b(show|find|recommend|suggest|give|me|products?|items?|under|below|over|above|cheapest|best|rated|please)\b/g, " ").replace(/\$?\d+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "products";
}
function isShownProductQuestion(text: string) { return /\b(worth|which|better|good|tell me about|this|that|these)\b/i.test(text); }
function fallbackWhyBuy(product: WhyBuyInput["product"]) { return `${product.title ?? "This product"} is worth considering${typeof product.rating === "number" ? ` with a ${product.rating.toFixed(1)}/5 rating` : ""}${typeof product.price === "number" ? ` at $${product.price.toFixed(2)}` : ""}.`; }
