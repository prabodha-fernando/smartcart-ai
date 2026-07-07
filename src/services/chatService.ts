// Shopping-assistant service: builds the prompt, calls the central AI client,
// validates the JSON decision, and — as the backend — resolves the actual
// products. The route handler stays thin; all business logic lives here.

import type { AIChatResponse, LimitedProduct, Product } from "@/types/product";
import type { AIApiAction, AIDecision, AIFilters } from "@/lib/ai/types";
import { CATEGORIES } from "@/lib/ai/types";
import { callNvidiaAI, NVIDIA_MODEL } from "@/lib/ai/nvidiaClient";
import {
  buildCategorySelectionPrompt,
  buildChatPrompt,
  buildProductSelectionPrompt,
  buildReplyPrompt,
  formatConversation,
  formatProductContext,
} from "@/lib/ai/promptBuilder";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dummyjson.com";
const MAX_PRODUCTS = 4;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Entry point used by the route. Returns the reply plus any products the
// backend resolved from the model's decision.
export async function resolveChat(input: {
  messages: ChatMessage[];
  lastProducts: LimitedProduct[];
}): Promise<AIChatResponse> {
  const { messages, lastProducts } = input;

  const decision = await getDecision(messages, lastProducts);

  // The small model is unreliable at price direction ("above" vs "under"), so
  // parse the bounds from the text and let them win.
  const lastUserText =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  let filters = applyPriceBounds(decision.filters, lastUserText);
  filters = applySort(filters, lastUserText);
  const resultLimit = resolveResultLimit(lastUserText);
  // The model sometimes extracts only the price and drops the category
  // ("smartphones above 800"), so recover it from the raw text.
  if (!filters.category) {
    const recovered = resolveCategory(lastUserText);
    if (recovered) filters = { ...filters, category: recovered };
  }

  // AI chooses the path via apiAction; the backend validates and executes it.
  let products: LimitedProduct[] = [];
  if (decision.needsMoreInformation || !decision.requiresApiCall) {
    // Waiting on the shopper for more detail — ask, don't search.
  } else {
    products = await runApiAction(
      decision.apiAction,
      filters,
      messages,
      resultLimit
    );
  }

  // Once we have the actual products, generate a real, grounded reply that
  // talks about them — instead of the generic pre-fetch reply.
  let reply = decision.reply;
  if (products.length > 0) {
    reply = (await generateGroundedReply(messages, products)) ?? decision.reply;
  } else if (
    lastProducts.length > 0 &&
    !decision.needsMoreInformation &&
    isAboutShownProducts(messages)
  ) {
    // A follow-up/opinion about products already on screen (e.g. "is this
    // worth it?" on a product page). The small model often mis-classifies
    // these, so answer about the shown products directly.
    reply =
      (await generateGroundedReply(messages, lastProducts)) ?? decision.reply;
  } else if (decision.requiresApiCall && !decision.needsMoreInformation) {
    // Wanted products but the search came back empty — be honest instead of
    // using the misleading pre-fetch reply.
    reply =
      "I couldn't find anything matching that in our store right now. Try a different style, category, or price range and I'll take another look.";
  }

  return {
    reply,
    products,
    intent: decision.intent,
    isNewSearch: products.length > 0,
  };
}

// True when the latest message reads like an opinion/value/comparison question
// about products already on screen ("is that worth it?", "which is better?").
function isAboutShownProducts(messages: ChatMessage[]): boolean {
  const text =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  return /\b(worth|good|great|better|best|value|quality|reliable|recommend|is (it|this|that)|should i|tell me about|how (is|are) (it|this|that|these))\b/i.test(
    text
  );
}

// Second AI call: writes a natural, grounded reply about the resolved products.
async function generateGroundedReply(
  messages: ChatMessage[],
  products: LimitedProduct[]
): Promise<string | null> {
  const conversation = formatConversation(messages.slice(-8));
  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt: buildReplyPrompt(conversation, products),
    temperature: 0.7,
    maxTokens: 200,
  });

  const reply =
    raw && raw.success !== false && typeof raw.reply === "string"
      ? raw.reply.trim()
      : "";
  return reply || null;
}

// --- The model call ------------------------------------------------------

async function getDecision(
  messages: ChatMessage[],
  lastProducts: LimitedProduct[]
): Promise<AIDecision> {
  const conversation = formatConversation(messages.slice(-8));
  const context = formatProductContext(lastProducts);
  const prompt = buildChatPrompt(conversation, context);

  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt,
    temperature: 0.2,
    maxTokens: 500,
  });
  // callNvidiaAI returns { success:false, ... } on failure — fall back then.
  return !raw || raw.success === false
    ? fallbackDecision(messages)
    : normalizeDecision(raw);
}

// --- Backend product resolution ------------------------------------------

async function runApiAction(
  apiAction: AIApiAction,
  filters: AIFilters,
  messages: ChatMessage[],
  resultLimit: number
): Promise<LimitedProduct[]> {
  if (apiAction === "featured_products") {
    return fetchFeatured(resultLimit);
  }
  if (apiAction === "recommended_products" || apiAction === "search_products") {
    return fetchByFilters(apiAction, filters, messages, resultLimit);
  }
  return [];
}

// Parses explicit price direction from the shopper's text and overrides the
// model's guess. "above/over/more than X" -> minPrice; "under/below/up to X" ->
// maxPrice; "between X and Y" -> both. Only overrides when a direction word is
// present, so plain budgets ("a $500 phone") still use the model's extraction.
function applyPriceBounds(filters: AIFilters, text: string): AIFilters {
  const lower = text.toLowerCase();
  const n = (s: string) => Number(s.replace(/[,$]/g, ""));

  const between = lower.match(
    /between\s*\$?(\d[\d,]*)\s*(?:and|-|to)\s*\$?(\d[\d,]*)/
  );
  if (between) {
    return { ...filters, minPrice: n(between[1]), maxPrice: n(between[2]) };
  }

  const over = lower.match(
    /(?:over|above|more than|greater than|at least|starting (?:at|from)|minimum|min)\s*\$?(\d[\d,]*)/
  );
  const under = lower.match(
    /(?:under|below|less than|up to|within|at most|maximum|max|cheaper than|no more than)\s*\$?(\d[\d,]*)/
  );

  if (over || under) {
    return {
      ...filters,
      minPrice: over ? n(over[1]) : null,
      maxPrice: under ? n(under[1]) : null,
    };
  }

  return filters;
}

// Maps everyday product words to catalog categories, so the backend can recover
// a category when the model didn't supply one (e.g. "wedding dress"). Matched
// against whole word tokens, most-specific first.
const CATEGORY_SYNONYMS: { category: string; words: string[] }[] = [
  { category: "smartphones", words: ["smartphone", "smartphones", "phone", "phones", "iphone", "android", "galaxy", "pixel"] },
  { category: "laptops", words: ["laptop", "laptops", "notebook", "macbook", "ultrabook"] },
  { category: "tablets", words: ["tablet", "tablets", "ipad"] },
  { category: "mens-watches", words: ["watch", "watches", "wristwatch", "rolex"] },
  { category: "mens-shoes", words: ["shoe", "shoes", "sneaker", "sneakers", "trainers", "footwear"] },
  { category: "mens-shirts", words: ["shirt", "shirts", "tshirt", "tee"] },
  { category: "womens-dresses", words: ["dress", "dresses", "gown", "gowns", "frock", "wedding", "bridal", "bridesmaid"] },
  { category: "womens-bags", words: ["bag", "bags", "handbag", "purse", "tote", "backpack"] },
  { category: "womens-jewellery", words: ["jewellery", "jewelry", "necklace", "ring", "earring", "earrings", "bracelet"] },
  { category: "sunglasses", words: ["sunglasses", "sunglass", "shades"] },
  { category: "fragrances", words: ["perfume", "perfumes", "fragrance", "fragrances", "cologne", "scent"] },
  { category: "skin-care", words: ["skincare", "moisturizer", "moisturiser", "serum", "cleanser", "sunscreen"] },
  { category: "beauty", words: ["makeup", "lipstick", "mascara", "foundation", "eyeshadow", "cosmetics", "beauty"] },
  { category: "furniture", words: ["furniture", "sofa", "couch", "table", "chair", "desk", "bed", "wardrobe"] },
  { category: "kitchen-accessories", words: ["kitchen", "cookware", "utensil", "utensils", "knife", "pan", "pot"] },
  { category: "home-decoration", words: ["decoration", "decorations", "decor", "vase", "lamp", "cushion"] },
  { category: "groceries", words: ["grocery", "groceries", "snack", "snacks", "fruit", "vegetable", "food", "foods", "meal", "meals", "dinner", "lunch", "breakfast", "cook", "cooking", "ingredient", "ingredients", "meat", "chicken", "beef", "fish", "rice"] },
  { category: "motorcycle", words: ["motorcycle", "motorbike", "scooter"] },
  { category: "vehicle", words: ["car", "cars", "vehicle", "automobile"] },
  { category: "mobile-accessories", words: ["charger", "earbuds", "headphone", "headphones", "powerbank", "cable"] },
  { category: "sports-accessories", words: ["sports", "sport", "fitness", "gym", "football", "basketball", "cricket", "tennis", "yoga"] },
  { category: "tops", words: ["top", "tops", "blouse"] },
];

// Recovers a catalog category from free text when the model left it null.
function resolveCategory(text: string): string | null {
  const lower = text.toLowerCase();
  const tokens = new Set(lower.split(/\W+/).filter(Boolean));

  let category =
    CATEGORY_SYNONYMS.find((entry) =>
      entry.words.some((word) => tokens.has(word))
    )?.category ?? null;

  if (category) {
    const womens = /\b(women|womens|woman|ladies|female|her|bridal|wedding)\b/.test(lower);
    const mens = /\b(men|mens|man|male|his|him)\b/.test(lower);
    if (womens && category.startsWith("mens-")) {
      category = category.replace("mens-", "womens-");
    } else if (mens && category.startsWith("womens-")) {
      category = category.replace("womens-", "mens-");
    }
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      category = null;
    }
  }

  return category;
}

function resolveResultLimit(text: string): number {
  const lower = text.toLowerCase();
  const asksForOne =
    /\b(one|1|single)\b/.test(lower) ||
    /\b(only|just)\s+(one|1)\b/.test(lower) ||
    /\b(suggest|recommend|show|find|give|get)\s+(me\s+)?(a\s+)?(one|1|single)\s+(product|item|option|pick)\b/.test(lower) ||
    /\b(best|top|cheapest|lowest price|highest rated|top rated|newest|latest|most affordable|most expensive)\s+(product|item|option|pick)\b/.test(lower) ||
    /\b(recommend|suggest|show|find|give|get)\s+(me\s+)?(the\s+)?(best|top|cheapest|lowest price|highest rated|top rated|newest|latest|most affordable|most expensive)\b/.test(lower);

  return asksForOne ? 1 : MAX_PRODUCTS;
}

// Turns the model's filters into an actual catalog query, staying relevant to
// what was asked. Uses the model's category, or recovers one from the query.
// Prefers items meeting the budget/rating, relaxing those before returning
// nothing — but never shows unrelated products just to fill the grid.
async function fetchByFilters(
  apiAction: Extract<AIApiAction, "recommended_products" | "search_products">,
  filters: AIFilters,
  messages: ChatMessage[],
  resultLimit: number
): Promise<LimitedProduct[]> {
  const latestUserText =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const categoryInput = [latestUserText, filters.query, filters.purpose]
    .filter(Boolean)
    .join(" ");
  const rawQuery = [filters.query, filters.brand].filter(Boolean).join(" ").trim();
  const query = isFillerQuery(rawQuery) ? "" : rawQuery;
  const relevanceTerms = extractRelevanceTerms(
    [filters.query, latestUserText].filter(Boolean).join(" ")
  );
  const shouldUseCategoryFirst = apiAction === "recommended_products";
  const category =
    filters.category ??
    resolveCategory(categoryInput) ??
    (shouldUseCategoryFirst ? await chooseCategory(messages, filters) : null);

  const urls: string[] = [];

  if (category) {
    const pool = applyBrand(
      await fetchPool(`${BASE_URL}/products/category/${category}?limit=100`),
      filters.brand
    );
    const relevantPool = applyRelevanceTerms(pool, relevanceTerms);
    const selected = await selectProductsForNeed(
      messages,
      relevantPool,
      filters,
      resultLimit
    );
    if (selected.length > 0) return selected;
  }

  // Generic filler ("products", "items") isn't a real search term — ignore it
  // so a price-only browse can take over below.
  if (query) {
    urls.push(
      `${BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=100`
    );
    // Catalog search matches poorly on long phrases, so fall back to the most
    // salient single keyword (e.g. "monopod camera accessory" -> "monopod").
    const keyword = query.split(/\s+/).find((w) => w.length >= 4);
    if (keyword && keyword !== query) {
      urls.push(
        `${BASE_URL}/products/search?q=${encodeURIComponent(keyword)}&limit=100`
      );
    }
    // De-pluralize so a plural term still matches singular titles
    // ("skirts" -> "skirt", which matches "Corset With Black Skirt").
    if (query.endsWith("s") && query.length > 3) {
      urls.push(
        `${BASE_URL}/products/search?q=${encodeURIComponent(
          query.slice(0, -1)
        )}&limit=100`
      );
    }
  }

  const noRating = { ...filters, rating: null };

  for (const url of urls) {
    const pool = applyRelevanceTerms(
      applyBrand(await fetchPool(url), filters.brand),
      relevanceTerms
    );
    if (pool.length === 0) continue;

    // Price bounds are authoritative and never relaxed; only a rating bar is
    // dropped if it would otherwise empty the relevant pool. The matching pool
    // still goes back to AI so it can choose the products that best fit the
    // user's actual need before we show cards.
    const selected = await selectProductsForNeed(
      messages,
      pool,
      filters,
      resultLimit
    );
    const chosen =
      selected.length > 0
        ? selected
        : await selectProductsForNeed(messages, pool, noRating, resultLimit);
    if (chosen.length > 0) {
      return chosen;
    }
  }

  // Generic price/rating browse ("products above $1000") — only when there's no
  // category AND no real product keyword. A specific term that found nothing
  // (e.g. "skirts under 5") must NOT fall back to unrelated catalog items.
  const hasPriceOrRating =
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.rating !== null;
  if (!category && !query && hasPriceOrRating) {
    return selectProductsForNeed(
      messages,
      await fetchPool(`${BASE_URL}/products?limit=100`),
      filters,
      resultLimit
    );
  }

  // No relevant match — show nothing rather than unrelated products.
  return [];
}

const RELEVANCE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "available",
  "best",
  "buy",
  "can",
  "find",
  "for",
  "from",
  "give",
  "have",
  "in",
  "me",
  "need",
  "one",
  "only",
  "option",
  "options",
  "please",
  "product",
  "products",
  "recommend",
  "show",
  "single",
  "store",
  "suggest",
  "the",
  "to",
  "with",
  "you",
]);

const BROAD_RELEVANCE_TERMS = new Set([
  "anything",
  "beauty",
  "category",
  "dinner",
  "gift",
  "idea",
  "meal",
  "something",
  "stuff",
  "thing",
]);

function extractRelevanceTerms(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(normalizeKeyword)
    .filter((word) => word.length >= 3)
    .filter((word) => !RELEVANCE_STOP_WORDS.has(word))
    .filter((word) => !BROAD_RELEVANCE_TERMS.has(word));

  return Array.from(new Set(words));
}

function normalizeKeyword(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function applyRelevanceTerms(pool: Product[], terms: string[]): Product[] {
  if (terms.length === 0) return pool;

  const matched = pool.filter((product) => productMatchesTerms(product, terms));
  return matched.length > 0 ? matched : pool;
}

function productMatchesTerms(product: Product, terms: string[]): boolean {
  const haystack = [
    product.title,
    product.category,
    product.description,
    product.brand,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const normalizedHaystack = normalizeKeyword(haystack);
  return terms.some((term) => normalizedHaystack.includes(term));
}

async function fetchCategorySlugs(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/products/categories`);
    if (!response.ok) return [...CATEGORIES];
    const data = (await response.json()) as Array<string | { slug?: string }>;
    const slugs = data
      .map((item) => (typeof item === "string" ? item : item.slug))
      .filter((slug): slug is string => Boolean(slug));
    return slugs.length > 0 ? slugs : [...CATEGORIES];
  } catch {
    return [...CATEGORIES];
  }
}

async function chooseCategory(
  messages: ChatMessage[],
  filters: AIFilters
): Promise<string | null> {
  const categories = await fetchCategorySlugs();
  const conversation = formatConversation(messages.slice(-8));
  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt: buildCategorySelectionPrompt(conversation, categories),
    temperature: 0.1,
    maxTokens: 120,
  });

  const category =
    raw &&
    raw.success !== false &&
    typeof raw.category === "string" &&
    categories.includes(raw.category)
      ? raw.category
      : null;

  if (category) return category;

  return resolveCategory([filters.query, filters.purpose].filter(Boolean).join(" "));
}

async function selectProductsForNeed(
  messages: ChatMessage[],
  pool: Product[],
  filters: AIFilters,
  resultLimit: number
): Promise<LimitedProduct[]> {
  if (pool.length === 0) return [];

  const filtered = filterPool(pool, filters);
  const candidates = filtered.length > 0 ? filtered : filterPool(pool, {
    ...filters,
    rating: null,
  });
  if (candidates.length === 0) return [];

  const shortlist = candidates.sort(sortComparator(filters.sort)).slice(0, 20);
  const conversation = formatConversation(messages.slice(-8));
  const raw = await callNvidiaAI({
    model: NVIDIA_MODEL,
    prompt: buildProductSelectionPrompt(conversation, shortlist, resultLimit),
    temperature: 0.2,
    maxTokens: 160,
  });

  const ids: number[] =
    raw && raw.success !== false && Array.isArray(raw.productIds)
      ? raw.productIds.filter((id: unknown): id is number => typeof id === "number")
      : [];
  const byId = new Map(shortlist.map((product) => [product.id, product]));
  const selected = ids
    .map((id) => byId.get(id))
    .filter((product): product is Product => Boolean(product))
    .slice(0, resultLimit);

  return toLimitedProducts(
    selected.length > 0 ? selected : shortlist.slice(0, resultLimit)
  );
}

function filterPool(pool: Product[], filters: AIFilters): Product[] {
  return pool
    .filter((p) =>
      typeof filters.minPrice === "number" ? p.price >= filters.minPrice : true
    )
    .filter((p) =>
      typeof filters.maxPrice === "number" ? p.price <= filters.maxPrice : true
    )
    .filter((p) =>
      typeof filters.rating === "number" ? p.rating >= filters.rating : true
    );
}

function toLimitedProducts(products: Product[]): LimitedProduct[] {
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    rating: p.rating,
    thumbnail: p.thumbnail,
  }));
}

function isFillerQuery(query: string): boolean {
  const fillers = new Set([
    "product", "products", "item", "items", "stuff", "thing", "things",
    "anything", "something", "everything", "some", "any",
  ]);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => fillers.has(w));
}

// Featured / trending picks: the top-rated products across the catalog.
async function fetchFeatured(resultLimit = MAX_PRODUCTS): Promise<LimitedProduct[]> {
  const pool = await fetchPool(`${BASE_URL}/products?limit=100`);
  return rankProducts(pool, {}, resultLimit);
}

function applyBrand(pool: Product[], brand: string | null): Product[] {
  if (!brand) return pool;
  const needle = brand.toLowerCase();
  const matched = pool.filter((p) => p.brand?.toLowerCase().includes(needle));
  return matched.length > 0 ? matched : pool;
}

async function fetchPool(url: string): Promise<Product[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = (await response.json()) as { products?: Product[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

// Applies the price/rating filters, orders by the requested sort (default:
// rating, highest first), trims to the card limit.
function rankProducts(
  pool: Product[],
  filters:
    | Pick<AIFilters, "minPrice" | "maxPrice" | "rating" | "sort">
    | Record<string, never>,
  resultLimit = MAX_PRODUCTS
): LimitedProduct[] {
  const minPrice = "minPrice" in filters ? filters.minPrice : null;
  const maxPrice = "maxPrice" in filters ? filters.maxPrice : null;
  const rating = "rating" in filters ? filters.rating : null;
  const sort = "sort" in filters ? filters.sort : null;

  return pool
    .filter((p) => (typeof minPrice === "number" ? p.price >= minPrice : true))
    .filter((p) => (typeof maxPrice === "number" ? p.price <= maxPrice : true))
    .filter((p) => (typeof rating === "number" ? p.rating >= rating : true))
    .sort(sortComparator(sort))
    .slice(0, resultLimit)
    .map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      rating: p.rating,
      thumbnail: p.thumbnail,
    }));
}

// Ordering strategy for the results grid. Defaults to highest rating.
function sortComparator(sort: string | null): (a: Product, b: Product) => number {
  switch (sort) {
    case "price_asc":
      return (a, b) => a.price - b.price;
    case "price_desc":
      return (a, b) => b.price - a.price;
    case "newest":
      return (a, b) => b.id - a.id;
    case "rating":
    default:
      return (a, b) => b.rating - a.rating;
  }
}

// Parses an explicit sort request from the shopper's text and overrides the
// model's guess. Only overrides when a sort phrase is present.
function applySort(filters: AIFilters, text: string): AIFilters {
  const l = text.toLowerCase();
  let sort: string | null = null;

  if (/\b(cheapest|cheaper|lowest price|least expensive|most affordable|affordable|budget|low to high|price low)\b/.test(l)) {
    sort = "price_asc";
  } else if (/\b(most expensive|expensive|highest price|priciest|premium|luxur\w+|high[- ]end|top of the line|price high|high to low)\b/.test(l)) {
    sort = "price_desc";
  } else if (/\b(newest|latest|new arrivals?|most recent|recent)\b/.test(l)) {
    sort = "newest";
  } else if (/\b(best rated|highest rated|top rated|best reviewed|best reviews|best quality|top quality|highest quality|most popular)\b/.test(l)) {
    sort = "rating";
  }

  return sort ? { ...filters, sort } : filters;
}

// --- Validation & fallbacks ----------------------------------------------

function emptyFilters(): AIFilters {
  return {
    category: null,
    brand: null,
    query: null,
    minPrice: null,
    maxPrice: null,
    rating: null,
    purpose: null,
    color: null,
    sort: null,
  };
}

const SORTS = new Set(["price_asc", "price_desc", "rating", "newest"]);
const API_ACTIONS = new Set<AIApiAction>([
  "",
  "search_products",
  "recommended_products",
  "featured_products",
]);

// Coerces the model's JSON into a safe, fully-typed decision.
function normalizeDecision(value: Record<string, unknown>): AIDecision {
  const raw = (value.filters ?? {}) as Record<string, unknown>;

  // Accept an exact category, else recover one from a loose value the model
  // might emit ("laptop" -> "laptops", "phone" -> "smartphones").
  let category: string | null = null;
  if (typeof raw.category === "string" && raw.category.trim()) {
    category = CATEGORIES.includes(raw.category as (typeof CATEGORIES)[number])
      ? raw.category
      : resolveCategory(raw.category);
  }

  return {
    intent: typeof value.intent === "string" ? value.intent : "product_search",
    requiresApiCall: value.requiresApiCall === true,
    apiAction:
      typeof value.apiAction === "string" &&
      API_ACTIONS.has(value.apiAction as AIApiAction)
        ? (value.apiAction as AIApiAction)
        : "",
    needsMoreInformation: value.needsMoreInformation === true,
    missingInformation: Array.isArray(value.missingInformation)
      ? value.missingInformation.filter((x): x is string => typeof x === "string")
      : [],
    filters: {
      category,
      brand: asString(raw.brand),
      query: asString(raw.query),
      minPrice: asNumber(raw.minPrice),
      maxPrice: asNumber(raw.maxPrice),
      rating: asNumber(raw.rating),
      purpose: asString(raw.purpose),
      color: asString(raw.color),
      sort:
        typeof raw.sort === "string" && SORTS.has(raw.sort) ? raw.sort : null,
    },
    reply:
      typeof value.reply === "string" && value.reply.trim()
        ? value.reply.trim()
        : "Here's what I found for you.",
    confidenceScore: asNumber(value.confidenceScore) ?? 0,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Used when the AI is unavailable or returns unusable output. Keeps the
// assistant working with a minimal intent guess.
function fallbackDecision(messages: ChatMessage[]): AIDecision {
  const text =
    [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const lower = text.toLowerCase();

  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return {
      intent: "greeting",
      requiresApiCall: false,
      apiAction: "",
      needsMoreInformation: false,
      missingInformation: [],
      filters: emptyFilters(),
      reply: "Hello! What are you shopping for today?",
      confidenceScore: 40,
    };
  }

  return {
    intent: "search",
    requiresApiCall: true,
    apiAction: "search_products",
    needsMoreInformation: false,
    missingInformation: [],
    filters: { ...emptyFilters(), query: text.slice(0, 60) || null },
    reply: "Here are a few options you might like.",
    confidenceScore: 30,
  };
}
