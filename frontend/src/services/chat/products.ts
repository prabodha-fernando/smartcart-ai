import type { LimitedProduct, Product } from "@/types/product";
import type { AIApiAction, AIFilters } from "@/lib/ai/types";
import { CATEGORIES } from "@/lib/ai/types";
import { callNvidiaAI, NVIDIA_MODEL } from "@/lib/ai/nvidiaClient";
import {
  buildCategorySelectionPrompt,
  buildProductSelectionPrompt,
  formatConversation,
} from "@/lib/ai/promptBuilder";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import {
  applyBrand,
  applyNeedProductProfile,
  applyRelevanceTerms,
  isFillerQuery,
  resolveCategory,
  resolveCategoryCandidates,
  sortComparator,
} from "@/services/chat/productHelpers";
import { ChatMessage, latestUserTurn, MAX_PRODUCTS } from "@/services/chat/shared";

const BASE_URL = getApiBaseUrl();

export async function runApiAction(
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
  const categoryCandidates = resolveCategoryCandidates(latestUserText);
  const chosenCategory =
    filters.category ??
    resolveCategory(categoryInput) ??
    (shouldUseCategoryFirst ? await chooseCategory(messages, filters) : null);
  const categories =
    categoryCandidates.length > 0
      ? categoryCandidates
      : chosenCategory
      ? [chosenCategory]
      : [];

  const urls: string[] = [];

  if (categories.length > 0) {
    const categoryPools = await Promise.all(
      categories.map((category) =>
        fetchPool(`${BASE_URL}/products/category/${category}?limit=100`)
      )
    );
    const pool = applyNeedProductProfile(
      applyBrand(categoryPools.flat(), filters.brand),
      latestUserText
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
      applyNeedProductProfile(
        applyBrand(await fetchPool(url), filters.brand),
        latestUserText
      ),
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
  if (categories.length === 0 && !query && hasPriceOrRating) {
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
  "electronic",
  "electronics",
  "gamer",
  "gamers",
  "gaming",
  "gift",
  "idea",
  "ingredient",
  "ingredients",
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
  const conversation = formatConversation(latestUserTurn(messages));
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
  const conversation = formatConversation(latestUserTurn(messages));
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

// Featured / trending picks: the top-rated products across the catalog.
async function fetchFeatured(resultLimit = MAX_PRODUCTS): Promise<LimitedProduct[]> {
  const pool = await fetchPool(`${BASE_URL}/products?limit=100`);
  return rankProducts(pool, {}, resultLimit);
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

