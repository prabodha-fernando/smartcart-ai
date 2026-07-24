import { catalogDb } from "./product.service.js";
import { completeText, completeJson, streamText } from "../utils/aiClient.js";
import {
  buildShoppingDecisionPrompt,
  buildWhyBuyPrompt,
  buildCategorySelectionPrompt,
  buildProductSelectionPrompt,
  buildConversationalReplyPrompt,
  buildGroundedReplyPrompt,
} from "../utils/promptBuilder.js";
import type { AiChatInput, WhyBuyInput } from "../validators/ai.validator.js";
import {
  shoppingDecisionResponseSchema,
  categorySelectionResponseSchema,
  productSelectionResponseSchema,
  allowedCategories,
  type SearchPlan
} from "../validators/ai-response.validator.js";

interface CatalogProduct {
  id: number; title: string; price: number; rating: number; thumbnail: string;
  category?: string; description?: string; brand?: string;
  reviews?: unknown[];
  tags?: string[]; discountPercentage?: number; stock?: number;
}

type SearchSort = SearchPlan["sort"];

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
      const reply = await groundedReply(input.messages, input.lastProducts);
      return { reply, products: [], intent: decision.intent, isNewSearch: false };
    }
    const reply = await conversationalReply(input.messages, decision.intent, decision.reply);
    return { reply, products: [], intent: decision.intent, isNewSearch: false };
  }

  if (isShownProductQuestion(latest) && input.lastProducts.length > 0) {
    const reply = await groundedReply(input.messages, input.lastProducts);
    return { reply, products: [], intent: "product_question", isNewSearch: false };
  }

  const searchText = buildSearchText(input.messages);
  const products = await findProducts(searchText, input.messages, decision.search);
  const reply = products.length
    ? await groundedReply(input.messages, products)
    : "I couldn't find a matching product right now. Try another product name, category, or budget.";
  return { reply, products, intent: decision.intent, isNewSearch: products.length > 0 };
}

export async function resolveAiChatStream(
  input: AiChatInput,
  onStart: (metadata: { products: CatalogProduct[], intent: string, isNewSearch: boolean }) => void,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const latest = [...input.messages].reverse().find((message) => message.role === "user")!.content;
  const decision = await getShoppingDecision(input);

  if (!decision.requiresProducts) {
    if (decision.intent === "product_question" && input.lastProducts.length > 0) {
      onStart({ products: [], intent: decision.intent, isNewSearch: false });
      await streamGroundedReply(input.messages, input.lastProducts, onChunk);
      onDone();
      return;
    }
    
    onStart({ products: [], intent: decision.intent, isNewSearch: false });
    await streamConversationalReply(input.messages, decision.intent, decision.reply, onChunk);
    onDone();
    return;
  }

  if (isShownProductQuestion(latest) && input.lastProducts.length > 0) {
    onStart({ products: [], intent: "product_question", isNewSearch: false });
    await streamGroundedReply(input.messages, input.lastProducts, onChunk);
    onDone();
    return;
  }

  const searchText = buildSearchText(input.messages);
  const products = await findProducts(searchText, input.messages, decision.search);
  
  onStart({ products, intent: decision.intent, isNewSearch: products.length > 0 });
  
  if (products.length) {
    await streamGroundedReply(input.messages, products, onChunk);
  } else {
    onChunk("I couldn't find a matching product right now. Try another product name, category, or budget.");
  }
  
  onDone();
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
  const raw = await completeJson(buildShoppingDecisionPrompt(transcript), 320);
  const parsed = shoppingDecisionResponseSchema.safeParse(raw);
  const decisionData = parsed.success ? parsed.data : shoppingDecisionResponseSchema.parse({});

  const intent = decisionData.intent;
  const hasExplicitSearchSignal =
    /\b(show|find|recommend|suggest|looking for|need|want|buy|cheapest|affordable|premium|best[- ]?selling|top rated|highest rated|under|below|over|above|between)\b/.test(lower) ||
    Object.keys(categoryTerms).some((term) => new RegExp(`\\b${term}s?\\b`).test(lower));
  const resolvedIntent = hasExplicitSearchSignal ? "product_search" : intent;
  return {
    intent: resolvedIntent,
    requiresProducts:
      resolvedIntent === "product_search" &&
      (hasExplicitSearchSignal || decisionData.requiresProducts !== false),
    reply: decisionData.reply.trim() || "Let me find the best matches in our catalog.",
    search: decisionData.search,
  };
}

export async function resolveWhyBuy(input: WhyBuyInput) {
  const product = input.product;
  const facts = Object.entries(product)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");
  const generated = await completeText(buildWhyBuyPrompt(facts, input.variation), 180, 8_000);
  return generated || fallbackWhyBuy(product, input.variation);
}

async function findProducts(text: string, messages: AiChatInput["messages"], plan: SearchPlan) {
  const lower = text.toLowerCase();
  const explicitPlan = constrainPlanToCustomerRequest(plan, lower);
  const needCategories = needCategoryRules.find((rule) => rule.test.test(lower))?.categories;
  const directCategory = Object.entries(categoryTerms).find(([term]) => new RegExp(`\\b${term}s?\\b`).test(lower))?.[1];
  const categories = await resolveRequestCategories(lower, needCategories, directCategory, explicitPlan);
  const query = [explicitPlan.query, explicitPlan.purpose].filter(Boolean).join(" ") || extractQuery(lower);
  let products: CatalogProduct[];
  if (categories.length > 0) {
    const responses = await Promise.all(
      categories.map((category) => catalogDb.get(`/products/category/${category}`, { params: { limit: 100 } }))
    );
    products = responses.flatMap(({ data }) => (data.data ?? []) as CatalogProduct[]);
  } else if (query) {
    const { data } = await catalogDb.get("/products/search", { params: { q: query, limit: 100 } });
    products = (data.data ?? []) as CatalogProduct[];
  } else {
    products = [];
  }
  products = applyNeedRelevance(products, lower);
  const relevanceTerms = extractRelevanceTerms(lower);
  const lexicallyRelevant = products.filter((product) => lexicalRelevance(product, relevanceTerms) > 0);
  if (lexicallyRelevant.length > 0) products = lexicallyRelevant;
  const explicitBrand = explicitPlan.brand ?? products.find((product) =>
    product.brand && lower.includes(product.brand.toLowerCase())
  )?.brand ?? null;
  if (explicitBrand) {
    const brand = explicitBrand.toLowerCase();
    products = products.filter((product) =>
      `${product.brand ?? ""} ${product.title}`.toLowerCase().includes(brand)
    );
  }
  const requestedColor = explicitPlan.color ?? extractRequestedColor(lower);
  if (requestedColor) {
    const color = requestedColor.toLowerCase();
    products = products.filter((product) =>
      `${product.title} ${product.description ?? ""}`.toLowerCase().includes(color)
    );
  }
  if (explicitPlan.inStock === true || /\b(in stock|available now|available products?)\b/.test(lower)) {
    products = products.filter((product) => (product.stock ?? 0) > 0);
  }
  const discountMatch = lower.match(/(?:at least|minimum|over|above)\s*(\d+)%\s*(?:off|discount)/);
  const minDiscount = discountMatch ? Number(discountMatch[1]) : explicitPlan.minDiscount;
  if (minDiscount !== null) {
    products = products.filter((product) => (product.discountPercentage ?? 0) >= minDiscount);
  }
  const under = lower.match(/(?:under|below|up to|less than)\s*\$?(\d+)/);
  const over = lower.match(/(?:over|above|at least|more than)\s*\$?(\d+)/);
  const between = lower.match(/between\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/);
  if (between) products = products.filter((p) => p.price >= Number(between[1]) && p.price <= Number(between[2]));
  if (under) products = products.filter((p) => p.price <= Number(under[1]));
  if (over) products = products.filter((p) => p.price >= Number(over[1]));
  if (!under && !between && explicitPlan.maxPrice !== null) products = products.filter((p) => p.price <= explicitPlan.maxPrice!);
  if (!over && !between && explicitPlan.minPrice !== null) products = products.filter((p) => p.price >= explicitPlan.minPrice!);
  const requestedSort: SearchSort = /cheapest|lowest price|affordable/.test(lower) ? "price_asc"
    : /most expensive|premium|highest price/.test(lower) ? "price_desc"
    : /newest|latest|recent/.test(lower) ? "newest"
    : /best rated|highest rated|top(?:\s+[1-4])?\s+rated/.test(lower) ? "rating"
    : /best[- ]?selling|most sold|popular|most purchased/.test(lower) ? "best_selling"
    : /highest discount|biggest discount|most discounted|best discount/.test(lower) ? "discount"
    : explicitPlan.sort;
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
  const rankedCountRequest = /\btop\s+[1-4]\s+rated\b/.test(lower);
  const rating = rankedCountRequest
    ? null
    : lower.match(/(?:at least|minimum|min|above|over)?\s*(\d(?:\.\d)?)\s*(?:star|stars|rated)/);
  if (rating) products = products.filter((product) => product.rating >= Number(rating[1]));
  if (!rating && explicitPlan.minRating !== null) products = products.filter((product) => product.rating >= explicitPlan.minRating!);
  const explicitLimit = extractRequestedLimit(lower);
  const defaultsToSingleResult = requestedSort === "rating" || requestedSort === "best_selling";
  const limit = explicitLimit ?? (defaultsToSingleResult ? 1 : explicitPlan.limit);
  const shortlist = products.slice(0, 20);
  // Explicit ranking is authoritative; AI must not override "top rated",
  // "best selling", price, or newest requests after deterministic sorting.
  const selected = requestedSort
    ? shortlist.slice(0, limit)
    : await selectProductsWithAI(shortlist, messages, limit);
  return selected.map(({ id, title, price, rating, thumbnail }) => ({ id, title, price, rating, thumbnail }));
}

function constrainPlanToCustomerRequest(plan: SearchPlan, request: string): SearchPlan {
  const mentions = (value: string | null) =>
    Boolean(value && request.includes(value.toLowerCase()));
  const hasPriceConstraint = /(?:\$|under|below|up to|less than|over|above|at least|more than|between|budget)\s*\$?\d|\$\d/.test(request);
  const hasRatingConstraint = /\d(?:\.\d)?\s*(?:star|stars|rated)/.test(request) && !/\btop\s+[1-4]\s+rated\b/.test(request);
  const hasDiscountConstraint = /\d+%\s*(?:off|discount)|(?:discount|off)\s*(?:of\s*)?\d+%/.test(request);
  const hasStockConstraint = /\b(in stock|available now|available products?|out of stock)\b/.test(request);
  const hasSortConstraint = /\b(cheapest|lowest price|affordable|most expensive|premium|highest price|newest|latest|recent|best rated|highest rated|top(?:\s+[1-4])?\s+rated|best[- ]?selling|most sold|popular|most purchased|highest discount|biggest discount|most discounted|best discount)\b/.test(request);

  return {
    ...plan,
    brand: mentions(plan.brand) ? plan.brand : null,
    color: mentions(plan.color) ? plan.color : null,
    minPrice: hasPriceConstraint ? plan.minPrice : null,
    maxPrice: hasPriceConstraint ? plan.maxPrice : null,
    minRating: hasRatingConstraint ? plan.minRating : null,
    minDiscount: hasDiscountConstraint ? plan.minDiscount : null,
    inStock: hasStockConstraint ? plan.inStock : null,
    sort: hasSortConstraint ? plan.sort : null,
  };
}

function extractRequestedColor(request: string) {
  const colors = [
    "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
    "orange", "brown", "grey", "gray", "silver", "gold", "beige", "navy",
  ];
  return colors.find((color) => new RegExp(`\\b${color}\\b`).test(request)) ?? null;
}

function extractRequestedLimit(request: string) {
  const numberWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
  };
  const patterns = [
    /\btop\s+([1-4]|one|two|three|four)\b/,
    /\b(?:show|give|find|recommend|suggest)\s+(?:me\s+)?(?:the\s+)?([1-4]|one|two|three|four)\b/,
    /\b(one|single)\s+(?:best|top|highest|cheapest|lowest|product|item)\b/,
  ];
  const match = patterns.map((pattern) => request.match(pattern)).find(Boolean);
  if (!match?.[1]) return null;
  if (match[1] === "single") return 1;
  return numberWords[match[1]] ?? Number(match[1]);
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

  const raw = await completeJson(buildCategorySelectionPrompt(request, available), 140);
  const parsed = categorySelectionResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data.categories : [];
}

async function fetchAvailableCategories() {
  try {
    const { data } = await catalogDb.get("/products/categories");
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
  const raw = await completeJson(buildProductSelectionPrompt(limit, request, catalog), 140);
  const parsed = productSelectionResponseSchema.safeParse(raw);
  const ids = parsed.success ? parsed.data.productIds : [];
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

async function conversationalReply(
  messages: AiChatInput["messages"],
  intent: ShoppingDecision["intent"],
  fallback: string
) {
  const transcript = formatConversation(messages);
  const generated = await completeText(
    buildConversationalReplyPrompt(intent, transcript),
    180,
    5_000
  );
  return generated || fallback;
}

async function groundedReply(
  messages: AiChatInput["messages"],
  products: Array<{ title: string; price: number; rating: number }>
) {
  const transcript = formatConversation(messages);
  const facts = products.map((p) => `${p.title}: $${p.price}, ${p.rating}/5`).join("\n");
  const generated = await completeText(
    buildGroundedReplyPrompt(transcript, facts),
    200,
    5_000
  );
  return generated && referencesSelectedProduct(generated, products)
    ? generated
    : fallbackGroundedReply(products);
}

async function streamConversationalReply(
  messages: AiChatInput["messages"],
  intent: ShoppingDecision["intent"],
  fallback: string,
  onChunk: (chunk: string) => void
) {
  const transcript = formatConversation(messages);
  let hasChunk = false;
  for await (const chunk of streamText(buildConversationalReplyPrompt(intent, transcript), 180, 5_000)) {
    hasChunk = true;
    onChunk(chunk);
  }
  if (!hasChunk) {
    onChunk(fallback);
  }
}

async function streamGroundedReply(
  messages: AiChatInput["messages"],
  products: Array<{ title: string; price: number; rating: number }>,
  onChunk: (chunk: string) => void
) {
  const transcript = formatConversation(messages);
  const facts = products.map((p) => `${p.title}: $${p.price}, ${p.rating}/5`).join("\n");
  
  let hasChunk = false;
  for await (const chunk of streamText(buildGroundedReplyPrompt(transcript, facts), 200, 5_000)) {
    hasChunk = true;
    onChunk(chunk);
  }

  if (!hasChunk) {
    onChunk(fallbackGroundedReply(products));
  }
}

function formatConversation(messages: AiChatInput["messages"]) {
  return messages
    .slice(-10)
    .map((message) => `${message.role === "user" ? "Customer" : "Assistant"}: ${message.content}`)
    .join("\n");
}

function referencesSelectedProduct(
  reply: string,
  products: Array<{ title: string }>
) {
  const normalizedReply = normalizeComparableText(reply);
  return products.some((product) =>
    normalizedReply.includes(normalizeComparableText(product.title))
  );
}

function normalizeComparableText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function fallbackGroundedReply(products: Array<{ title: string; price: number; rating: number }>) {
  if (products.length === 0) {
    return "I couldn't find a product matching those exact requirements in the current catalog.";
  }

  if (products.length === 1) {
    const product = products[0]!;
    return `${product.title} is the strongest catalog match at $${product.price.toFixed(2)}, with a ${product.rating.toFixed(1)}/5 rating.`;
  }

  const names = products.map((product) => product.title).join(", ");
  const prices = products.map((product) => product.price);
  const highestRating = Math.max(...products.map((product) => product.rating));
  return `I found ${products.length} matching options: ${names}. They range from $${Math.min(...prices).toFixed(2)} to $${Math.max(...prices).toFixed(2)}, with ratings up to ${highestRating.toFixed(1)}/5.`;
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
function fallbackWhyBuy(product: WhyBuyInput["product"], variation = 0) {
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

  const selected = sentences.slice(0, 3);
  const offset = selected.length > 1 ? variation % selected.length : 0;
  return [...selected.slice(offset), ...selected.slice(0, offset)].join(" ");
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
