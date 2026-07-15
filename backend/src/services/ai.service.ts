import { env } from "../config/env.js";
import { dummyjson } from "./product.service.js";
import type { AiChatInput, WhyBuyInput } from "../validators/ai.validator.js";

interface CatalogProduct {
  id: number; title: string; price: number; rating: number; thumbnail: string;
  category?: string; description?: string; brand?: string;
  reviews?: unknown[];
  tags?: string[]; discountPercentage?: number; stock?: number;
}

type SearchSort = "price_asc" | "price_desc" | "rating" | "best_selling" | "discount" | "newest" | null;
interface SearchPlan {
  query: string | null;
  categories: string[];
  brand: string | null;
  color: string | null;
  purpose: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  minDiscount: number | null;
  inStock: boolean | null;
  sort: SearchSort;
  limit: number;
}

interface ShoppingDecision {
  intent: "greeting" | "gratitude" | "product_search" | "product_question" | "app_question" | "out_of_scope";
  requiresProducts: boolean;
  reply: string;
  search: SearchPlan;
}

const emptySearchPlan = (): SearchPlan => ({
  query: null, categories: [], brand: null, color: null, purpose: null, minPrice: null, maxPrice: null,
  minRating: null, sort: null, limit: 4,
  minDiscount: null, inStock: null,
});

const categoryTerms: Record<string, string> = {
  beauty: "beauty", makeup: "beauty", mascara: "beauty", lipstick: "beauty", eyeshadow: "beauty",
  perfume: "fragrances", fragrance: "fragrances", cologne: "fragrances",
  furniture: "furniture", sofa: "furniture", chair: "furniture", desk: "furniture", bed: "furniture",
  grocery: "groceries", groceries: "groceries", food: "groceries", snack: "groceries",
  decoration: "home-decoration", decor: "home-decoration", vase: "home-decoration", lamp: "home-decoration",
  kitchen: "kitchen-accessories", cookware: "kitchen-accessories", utensil: "kitchen-accessories",
  laptop: "laptops", notebook: "laptops", macbook: "laptops",
  shirt: "mens-shirts", tshirt: "mens-shirts", sneaker: "mens-shoes", "mens shoe": "mens-shoes",
  "mens watch": "mens-watches", wristwatch: "mens-watches",
  charger: "mobile-accessories", headphone: "mobile-accessories", earbud: "mobile-accessories", powerbank: "mobile-accessories",
  motorcycle: "motorcycle", motorbike: "motorcycle", scooter: "motorcycle",
  skincare: "skin-care", moisturizer: "skin-care", serum: "skin-care", sunscreen: "skin-care",
  phone: "smartphones", smartphone: "smartphones", iphone: "smartphones", android: "smartphones",
  sport: "sports-accessories", fitness: "sports-accessories", cricket: "sports-accessories", football: "sports-accessories",
  sunglasses: "sunglasses", shades: "sunglasses", tablet: "tablets", ipad: "tablets",
  top: "tops", blouse: "tops", car: "vehicle", vehicle: "vehicle",
  bag: "womens-bags", handbag: "womens-bags", purse: "womens-bags",
  dress: "womens-dresses", gown: "womens-dresses", jewellery: "womens-jewellery", jewelry: "womens-jewellery",
  necklace: "womens-jewellery", earring: "womens-jewellery", "womens shoe": "womens-shoes",
  heel: "womens-shoes", "womens watch": "womens-watches",
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
  const products = await findProducts(searchText, input.messages, decision.search);
  const reply = products.length
    ? await groundedReply(latest, products)
    : "I couldn't find a matching product right now. Try another product name, category, or budget.";
  return { reply, products, intent: decision.intent, isNewSearch: products.length > 0 };
}

async function getShoppingDecision(input: AiChatInput): Promise<ShoppingDecision> {
  const latest = [...input.messages].reverse().find((message) => message.role === "user")!.content.trim();
  const lower = latest.toLowerCase();
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return { intent: "greeting", requiresProducts: false, reply: "Hello! What are you shopping for today?", search: emptySearchPlan() };
  }
  if (/^(thanks|thank you|thankyou|cheers)\b/.test(lower)) {
    return { intent: "gratitude", requiresProducts: false, reply: "You're welcome! Let me know if you'd like help finding anything else.", search: emptySearchPlan() };
  }
  if (/\b(worth|which is better|is (it|this|that) good|tell me about (it|this|that)|should i buy)\b/.test(lower) && input.lastProducts.length > 0) {
    return { intent: "product_question", requiresProducts: false, reply: "", search: emptySearchPlan() };
  }
  if (/\b(weather|news|homework|write code|politics|medical advice)\b/.test(lower)) {
    return { intent: "out_of_scope", requiresProducts: false, reply: "I’m here to help with shopping and product decisions. What would you like to find?", search: emptySearchPlan() };
  }

  const transcript = input.messages.slice(-8).map((message) => `${message.role}: ${message.content}`).join("\n");
  const raw = await completeJson(
    `Understand exactly what the shopper expects. Return only JSON: ` +
    `{"intent":"product_search|product_question|app_question|out_of_scope","requiresProducts":true,"reply":"short direct answer","search":{"query":null,"categories":[],"brand":null,"color":null,"purpose":null,"minPrice":null,"maxPrice":null,"minRating":null,"minDiscount":null,"inStock":null,"sort":null,"limit":4}}. ` +
    `Use only explicit constraints. sort is price_asc, price_desc, rating, best_selling, discount, newest, or null. ` +
    `Use rating only when the shopper asks for top/highest/best rated. Use best_selling only for best-selling or most-popular requests. ` +
    `limit is 1-4. Keep reply concise and do not add information the customer did not request.\n${transcript}`,
    320
  );
  const intent = raw && typeof raw.intent === "string" && ["product_search", "product_question", "app_question", "out_of_scope"].includes(raw.intent)
    ? raw.intent as ShoppingDecision["intent"]
    : "product_search";
  return {
    intent,
    requiresProducts: raw?.requiresProducts !== false && intent === "product_search",
    reply: typeof raw?.reply === "string" && raw.reply.trim() ? raw.reply.trim() : "Let me find the best matches in our catalog.",
    search: normalizeSearchPlan(raw?.search),
  };
}

export async function resolveWhyBuy(input: WhyBuyInput) {
  const product = input.product;
  const facts = Object.entries(product)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");
  const prompt = `Using only these facts, explain in 2-3 short, honest sentences why this product may be a good buy. No markdown or invented claims.\n${facts}`;
  const generated = await completeText(prompt, 180, 8_000);
  return generated || fallbackWhyBuy(product);
}

async function findProducts(text: string, messages: AiChatInput["messages"], plan: SearchPlan) {
  const lower = text.toLowerCase();
  const needCategories = needCategoryRules.find((rule) => rule.test.test(lower))?.categories;
  const directCategory = Object.entries(categoryTerms).find(([term]) => new RegExp(`\\b${term}s?\\b`).test(lower))?.[1];
  const categories = await resolveRequestCategories(lower, needCategories, directCategory, plan);
  const query = [plan.query, plan.purpose].filter(Boolean).join(" ") || extractQuery(lower);
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
  const relevanceTerms = extractRelevanceTerms(lower);
  const lexicallyRelevant = products.filter((product) => lexicalRelevance(product, relevanceTerms) > 0);
  if (lexicallyRelevant.length > 0) products = lexicallyRelevant;
  const explicitBrand = plan.brand ?? products.find((product) =>
    product.brand && lower.includes(product.brand.toLowerCase())
  )?.brand ?? null;
  if (explicitBrand) {
    const brand = explicitBrand.toLowerCase();
    products = products.filter((product) =>
      `${product.brand ?? ""} ${product.title}`.toLowerCase().includes(brand)
    );
  }
  if (plan.color) {
    const color = plan.color.toLowerCase();
    const matchingColor = products.filter((product) =>
      `${product.title} ${product.description ?? ""}`.toLowerCase().includes(color)
    );
    if (matchingColor.length > 0) products = matchingColor;
  }
  if (plan.inStock === true || /\b(in stock|available now|available products?)\b/.test(lower)) {
    products = products.filter((product) => (product.stock ?? 0) > 0);
  }
  const discountMatch = lower.match(/(?:at least|minimum|over|above)\s*(\d+)%\s*(?:off|discount)/);
  const minDiscount = discountMatch ? Number(discountMatch[1]) : plan.minDiscount;
  if (minDiscount !== null) {
    products = products.filter((product) => (product.discountPercentage ?? 0) >= minDiscount);
  }
  const under = lower.match(/(?:under|below|up to|less than)\s*\$?(\d+)/);
  const over = lower.match(/(?:over|above|at least|more than)\s*\$?(\d+)/);
  const between = lower.match(/between\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/);
  if (between) products = products.filter((p) => p.price >= Number(between[1]) && p.price <= Number(between[2]));
  if (under) products = products.filter((p) => p.price <= Number(under[1]));
  if (over) products = products.filter((p) => p.price >= Number(over[1]));
  if (!under && !between && plan.maxPrice !== null) products = products.filter((p) => p.price <= plan.maxPrice!);
  if (!over && !between && plan.minPrice !== null) products = products.filter((p) => p.price >= plan.minPrice!);
  const requestedSort: SearchSort = /cheapest|lowest price|affordable/.test(lower) ? "price_asc"
    : /most expensive|premium|highest price/.test(lower) ? "price_desc"
    : /newest|latest|recent/.test(lower) ? "newest"
    : /best rated|highest rated|top rated/.test(lower) ? "rating"
    : /best[- ]?selling|most sold|popular|most purchased/.test(lower) ? "best_selling"
    : /highest discount|biggest discount|most discounted|best discount/.test(lower) ? "discount"
    : plan.sort;
  if (requestedSort === "price_asc") products.sort((a, b) => a.price - b.price);
  else if (requestedSort === "price_desc") products.sort((a, b) => b.price - a.price);
  else if (requestedSort === "newest") products.sort((a, b) => b.id - a.id);
  else if (requestedSort === "rating") products.sort((a, b) => b.rating - a.rating);
  else if (requestedSort === "best_selling") {
    products.sort((a, b) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0) || b.rating - a.rating);
  }
  else if (requestedSort === "discount") {
    products.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
  }
  else products.sort((a, b) =>
    lexicalRelevance(b, relevanceTerms) - lexicalRelevance(a, relevanceTerms) ||
    relevanceScore(b, lower) - relevanceScore(a, lower) ||
    b.rating - a.rating
  );
  const rating = lower.match(/(?:at least|minimum|min|above|over)?\s*(\d(?:\.\d)?)\s*(?:star|stars|rated)/);
  if (rating) products = products.filter((product) => product.rating >= Number(rating[1]));
  if (!rating && plan.minRating !== null) products = products.filter((product) => product.rating >= plan.minRating!);
  const limit = /\b(one|single|1)\b/.test(lower) ? 1 : plan.limit;
  const shortlist = products.slice(0, 20);
  // Explicit ranking is authoritative; AI must not override "top rated",
  // "best selling", price, or newest requests after deterministic sorting.
  const selected = requestedSort
    ? shortlist.slice(0, limit)
    : await selectProductsWithAI(shortlist, messages, limit);
  return selected.map(({ id, title, price, rating, thumbnail }) => ({ id, title, price, rating, thumbnail }));
}

async function resolveRequestCategories(
  request: string,
  needCategories: string[] | undefined,
  directCategory: string | undefined,
  plan: SearchPlan
) {
  const available = await fetchAvailableCategories();
  const allowed = new Set(available);
  const deterministic = needCategories ?? (directCategory ? [directCategory] : []);
  const normalizedRequest = request.replace(/[^a-z0-9]+/g, "-");
  const wantsWomen = /\b(women|woman|womens|ladies|female|her)\b/.test(request);
  const wantsMen = /\b(men|man|mens|male|his)\b/.test(request);
  const categoryMention = available.find((category) => {
    const base = category.replace(/^(mens|womens)-/, "");
    if (!normalizedRequest.includes(category) && !normalizedRequest.includes(base)) return false;
    if (wantsWomen) return category.startsWith("womens-") || !category.startsWith("mens-");
    if (wantsMen) return category.startsWith("mens-") || !category.startsWith("womens-");
    return true;
  });
  const validated = [...deterministic, ...(categoryMention ? [categoryMention] : []), ...plan.categories]
    .filter((category, index, list) => allowed.has(category) && list.indexOf(category) === index)
    .slice(0, 3);
  if (validated.length > 0) return validated;

  const raw = await completeJson(
    `Choose up to 3 categories that best match the shopper's request. ` +
    `Use only exact slugs from AVAILABLE_CATEGORIES. Return an empty array if none fit. ` +
    `Return only {"categories":["slug"]}.\nREQUEST\n${request}\nAVAILABLE_CATEGORIES\n${available.join(", ")}`,
    140
  );
  return Array.isArray(raw?.categories)
    ? raw.categories.filter((category): category is string => typeof category === "string" && allowed.has(category)).slice(0, 3)
    : [];
}

async function fetchAvailableCategories() {
  try {
    const { data } = await dummyjson.get("/products/categories");
    const categories = (Array.isArray(data) ? data : [])
      .map((category: unknown) =>
        typeof category === "string"
          ? category
          : typeof category === "object" && category !== null && "slug" in category
            ? (category as { slug?: unknown }).slug
            : undefined
      )
      .filter((category: unknown): category is string => typeof category === "string");
    return categories.length > 0 ? categories : [...allowedCategories];
  } catch {
    return [...allowedCategories];
  }
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
    { test: /\b(mascara)\b/, product: /\bmascara\b/i },
    { test: /\b(lipsticks?)\b/, product: /\blipsticks?\b/i },
    { test: /\b(eyeshadows?)\b/, product: /\beyeshadows?\b/i },
    { test: /\b(perfumes?|fragrances?|cologne)\b/, product: /\b(perfume|fragrance|cologne)\b/i },
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

const relevanceStopWords = new Set([
  "a", "an", "and", "any", "best", "buy", "for", "from", "give", "help",
  "i", "in", "item", "items", "looking", "me", "need", "of", "one", "only",
  "please", "product", "products", "recommend", "show", "some", "suggest",
  "the", "to", "want", "with", "under", "over", "above", "below", "between",
  "cheapest", "expensive", "rated", "rating", "stars", "latest", "newest",
  "popular", "selling", "gift", "thoughtful", "something", "anything",
]);

function extractRelevanceTerms(request: string) {
  return Array.from(new Set(
    request.split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 3 && !relevanceStopWords.has(term) && !/^\d+$/.test(term))
      .map((term) => term.endsWith("s") && term.length > 4 ? term.slice(0, -1) : term)
  ));
}

function lexicalRelevance(product: CatalogProduct, terms: string[]) {
  if (terms.length === 0) return 0;
  const title = product.title.toLowerCase();
  const details = `${product.description ?? ""} ${(product.tags ?? []).join(" ")} ${product.brand ?? ""} ${product.category ?? ""}`.toLowerCase();
  return terms.reduce((score, term) =>
    score + (title.includes(term) ? 5 : 0) + (details.includes(term) ? 2 : 0), 0
  );
}

async function groundedReply(question: string, products: Array<{ title: string; price: number; rating: number }>) {
  const facts = products.map((p) => `${p.title}: $${p.price}, ${p.rating}/5`).join("\n");
  return (await completeText(`Answer the shopper warmly in 1-2 sentences using only these products.\nQuestion: ${question}\n${facts}`, 160))
    || `I found ${products.length === 1 ? products[0]!.title : "some strong matches"} based on your request.`;
}

async function completeText(prompt: string, maxTokens: number, timeoutMs = 10_000) {
  if (!env.NVIDIA_NIM_API_KEY) return null;
  try {
    const response = await fetch(`${env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.NVIDIA_NIM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: prompt }], temperature: 0.5, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
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
      signal: AbortSignal.timeout(10_000),
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

const allowedCategories = new Set([
  "beauty", "fragrances", "furniture", "groceries", "home-decoration",
  "kitchen-accessories", "laptops", "mens-shirts", "mens-shoes",
  "mens-watches", "mobile-accessories", "motorcycle", "skin-care",
  "smartphones", "sports-accessories", "sunglasses", "tablets", "tops",
  "vehicle", "womens-bags", "womens-dresses", "womens-jewellery",
  "womens-shoes", "womens-watches",
]);

function normalizeSearchPlan(value: unknown): SearchPlan {
  const raw = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter((category): category is string => typeof category === "string" && allowedCategories.has(category)).slice(0, 3)
    : [];
  const sort = typeof raw.sort === "string" && ["price_asc", "price_desc", "rating", "best_selling", "discount", "newest"].includes(raw.sort)
    ? raw.sort as SearchSort
    : null;
  const numberOrNull = (candidate: unknown) => typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
  return {
    query: typeof raw.query === "string" && raw.query.trim() ? raw.query.trim().slice(0, 80) : null,
    categories,
    brand: typeof raw.brand === "string" && raw.brand.trim() ? raw.brand.trim().slice(0, 80) : null,
    color: typeof raw.color === "string" && raw.color.trim() ? raw.color.trim().slice(0, 40) : null,
    purpose: typeof raw.purpose === "string" && raw.purpose.trim() ? raw.purpose.trim().slice(0, 80) : null,
    minPrice: numberOrNull(raw.minPrice),
    maxPrice: numberOrNull(raw.maxPrice),
    minRating: numberOrNull(raw.minRating),
    minDiscount: numberOrNull(raw.minDiscount),
    inStock: typeof raw.inStock === "boolean" ? raw.inStock : null,
    sort,
    limit: typeof raw.limit === "number" ? Math.min(4, Math.max(1, Math.floor(raw.limit))) : 4,
  };
}

function extractQuery(text: string) {
  return text.replace(/\b(show|find|recommend|suggest|give|me|products?|items?|under|below|over|above|cheapest|best|rated|please)\b/g, " ").replace(/\$?\d+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "products";
}
function isShownProductQuestion(text: string) { return /\b(worth|which|better|good|tell me about|this|that|these)\b/i.test(text); }
function fallbackWhyBuy(product: WhyBuyInput["product"]) {
  const name = product.title?.trim() || "This product";
  const category = product.category?.replace(/-/g, " ");
  const identity = product.brand && category
    ? `is a ${category} option from ${product.brand}`
    : product.brand
      ? `is an option from ${product.brand}`
      : category
        ? `is a ${category} option`
        : "is worth considering";
  const openingFacts = [
    identity,
    typeof product.rating === "number" ? `rated ${product.rating.toFixed(1)}/5` : null,
    typeof product.price === "number" ? `priced at $${product.price.toFixed(2)}` : null,
  ].filter(Boolean);

  const benefits: string[] = [];
  if (typeof product.discountPercentage === "number" && product.discountPercentage > 0) {
    benefits.push(`${formatNumber(product.discountPercentage)}% off`);
  }
  if (product.shippingInformation) benefits.push(product.shippingInformation);
  if (product.warrantyInformation) benefits.push(product.warrantyInformation);
  if (product.availabilityStatus) benefits.push(product.availabilityStatus);
  else if (typeof product.stock === "number") {
    benefits.push(product.stock > 0 ? `${product.stock} currently in stock` : "currently out of stock");
  }

  const sentences = [`${name} ${joinFacts(openingFacts)}.`];
  const description = product.description?.trim().replace(/\s+/g, " ");
  if (description) sentences.push(trimSentence(description, 180));
  if (benefits.length > 0) sentences.push(`Practical buying details include ${joinFacts(benefits)}.`);

  return sentences.slice(0, 3).join(" ");
}

function joinFacts(facts: Array<string | null>) {
  const values = facts.filter((fact): fact is string => Boolean(fact));
  if (values.length <= 1) return values[0] ?? "is worth considering";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function trimSentence(value: string, maxLength: number) {
  const shortened = value.length > maxLength
    ? `${value.slice(0, maxLength).replace(/\s+\S*$/, "")}…`
    : value;
  return /[.!?…]$/.test(shortened) ? shortened : `${shortened}.`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}
