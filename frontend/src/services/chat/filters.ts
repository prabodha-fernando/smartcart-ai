import type { Product } from "@/types/product";
import type { AIFilters } from "@/lib/ai/types";
import { CATEGORIES } from "@/lib/ai/types";
import { MAX_PRODUCTS } from "@/services/chat/shared";

// Parses explicit price direction from the shopper's text and overrides the
// model's guess. "above/over/more than X" -> minPrice; "under/below/up to X" ->
// maxPrice; "between X and Y" -> both. Only overrides when a direction word is
// present, so plain budgets ("a $500 phone") still use the model's extraction.
export function applyPriceBounds(filters: AIFilters, text: string): AIFilters {
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
  { category: "laptops", words: ["laptop", "laptops", "notebook", "macbook", "ultrabook", "gamer", "gamers", "gaming"] },
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
  { category: "mobile-accessories", words: ["charger", "earbuds", "headphone", "headphones", "headset", "headsets", "earphone", "earphones", "speaker", "speakers", "powerbank", "cable"] },
  { category: "sports-accessories", words: ["sports", "sport", "fitness", "gym", "football", "basketball", "cricket", "tennis", "yoga"] },
  { category: "tops", words: ["top", "tops", "blouse"] },
];

const NEED_CATEGORY_CANDIDATES: {
  test: RegExp;
  categories: (typeof CATEGORIES)[number][];
  query: string;
  purpose: string;
}[] = [
  {
    test: /\b(gamer|gamers|gaming|game setup|gaming setup|streamer|streaming setup)\b/i,
    categories: ["laptops", "mobile-accessories", "tablets"],
    query: "gaming electronics",
    purpose: "gaming",
  },
  {
    test: /\b(dinner|lunch|breakfast|meal|cook|cooking|ingredient|ingredients|meat|chicken|beef|fish|rice)\b/i,
    categories: ["groceries"],
    query: "food ingredients",
    purpose: "meal",
  },
  {
    test: /\b(home office|office setup|desk setup|workspace|work setup)\b/i,
    categories: ["furniture", "laptops", "mobile-accessories"],
    query: "office setup",
    purpose: "work",
  },
];

// Recovers a catalog category from free text when the model left it null.
export function resolveCategory(text: string): string | null {
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

export function resolveCategoryCandidates(text: string): string[] {
  const needRule = NEED_CATEGORY_CANDIDATES.find((rule) => rule.test.test(text));
  if (needRule) return needRule.categories;

  const category = resolveCategory(text);
  return category ? [category] : [];
}

export function applyLatestRequestOverrides(
  filters: AIFilters,
  latestUserText: string
): AIFilters {
  const needRule = NEED_CATEGORY_CANDIDATES.find((rule) =>
    rule.test.test(latestUserText)
  );
  if (needRule) {
    return {
      ...filters,
      category: needRule.categories[0],
      query: needRule.query,
      purpose: needRule.purpose,
    };
  }

  const category = resolveCategory(latestUserText);
  if (!category) return filters;

  return {
    ...filters,
    category,
  };
}

export function isExplicitProductDiscovery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\b(show|find|get|give|suggest|recommend|need|want|buy|looking for|search)\b.*\b(product|products|item|items|option|options|pick|picks|for)\b/.test(
      lower
    ) ||
    /\b(product|products|item|items|option|options|pick|picks)\b.*\b(for|about|related to)\b/.test(
      lower
    ) ||
    NEED_CATEGORY_CANDIDATES.some((rule) => rule.test.test(lower))
  );
}

export function resolveResultLimit(text: string): number {
  const lower = text.toLowerCase();
  const asksForOne =
    /\b(one|1|single)\b/.test(lower) ||
    /\b(only|just)\s+(one|1)\b/.test(lower) ||
    /\b(suggest|recommend|show|find|give|get)\s+(me\s+)?(a\s+)?(one|1|single)\s+(product|item|option|pick)\b/.test(lower) ||
    /\b(best|top|cheapest|lowest price|highest rated|top rated|newest|latest|most affordable|most expensive)\s+(product|item|option|pick)\b/.test(lower) ||
    /\b(recommend|suggest|show|find|give|get)\s+(me\s+)?(the\s+)?(best|top|cheapest|lowest price|highest rated|top rated|newest|latest|most affordable|most expensive)\b/.test(lower);

  return asksForOne ? 1 : MAX_PRODUCTS;
}

// Ordering strategy for the results grid. Defaults to highest rating.
export function sortComparator(sort: string | null): (a: Product, b: Product) => number {
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
export function applySort(filters: AIFilters, text: string): AIFilters {
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

