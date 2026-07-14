import type { Product } from "@/types/product";
import { resolveCategory, resolveCategoryCandidates, sortComparator } from "@/services/chat/filters";

export { resolveCategory, resolveCategoryCandidates, sortComparator };

export function applyRelevanceTerms(pool: Product[], terms: string[]): Product[] {
  if (terms.length === 0) return pool;

  const matched = pool.filter((product) => productMatchesTerms(product, terms));
  return matched.length > 0 ? matched : pool;
}

export function applyNeedProductProfile(pool: Product[], latestUserText: string): Product[] {
  const lower = latestUserText.toLowerCase();
  const profile = NEED_PRODUCT_PROFILES.find((item) => item.test.test(lower));
  if (!profile) return pool;

  const matched = pool.filter((product) => profile.matches(product));
  return matched.length > 0 ? matched : pool;
}

const NEED_PRODUCT_PROFILES: {
  test: RegExp;
  matches: (product: Product) => boolean;
}[] = [
  {
    test: /\b(gamer|gamers|gaming|game setup|gaming setup|streamer|streaming setup)\b/i,
    matches: (product) => {
      const haystack = productText(product);
      return (
        ["laptops", "tablets", "smartphones"].includes(product.category) ||
        /\b(headphones?|headsets?|earphones?|earbuds?|airpods|beats)\b/.test(
          haystack
        )
      );
    },
  },
  {
    test: /\b(dinner|lunch|meal|cook|cooking|ingredient|ingredients|meat|chicken|beef|fish|rice)\b/i,
    matches: (product) => {
      if (product.category !== "groceries") return false;
      const haystack = productText(product);
      if (/\b(coffee|tea|oil|juice|drink|beverage)\b/.test(haystack)) {
        return false;
      }
      return /\b(steak|meat|chicken|beef|fish|rice|pasta|vegetable|potato|cucumber|onion|egg|eggs|cheese)\b/.test(
        haystack
      );
    },
  },
];

function productText(product: Product): string {
  return [
    product.title,
    product.category,
    product.description,
    product.brand,
    ...(product.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function productMatchesTerms(product: Product, terms: string[]): boolean {
  const haystack = productText(product);

  const normalizedHaystack = normalizeKeyword(haystack);
  return terms.some((term) => normalizedHaystack.includes(term));
}

function normalizeKeyword(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function isFillerQuery(query: string): boolean {
  const fillers = new Set([
    "product", "products", "item", "items", "stuff", "thing", "things",
    "anything", "something", "everything", "some", "any",
  ]);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => fillers.has(w));
}

export function applyBrand(pool: Product[], brand: string | null): Product[] {
  if (!brand) return pool;
  const needle = brand.toLowerCase();
  const matched = pool.filter((p) => p.brand?.toLowerCase().includes(needle));
  return matched.length > 0 ? matched : pool;
}

