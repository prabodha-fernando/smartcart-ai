import axios from "axios";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Products stay sourced from DummyJSON, but every call goes through this
 * backend rather than the browser. This client is shared by the product proxy
 * routes and by cart/wishlist (which snapshot product details at add-time).
 */
export const dummyjson = axios.create({
  baseURL: env.DUMMYJSON_BASE_URL,
  timeout: 10_000,
});

export interface ProductSnapshot {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  rating: number;
}

interface CatalogProduct {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  brand?: string;
  tags?: string[];
  rating?: number;
  [key: string]: unknown;
}

export async function searchCatalog(query: string, skip = 0, limit = 100) {
  const normalizedQuery = normalizeSearchText(query).slice(0, 100);
  if (!normalizedQuery) return { products: [], total: 0, skip, limit };

  const { data } = await dummyjson.get("/products", { params: { limit: 0 } });
  const products = (Array.isArray(data.products) ? data.products : []) as CatalogProduct[];
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const rankMatches = (requireEveryToken: boolean) => products
    .map((product) => ({
      product,
      score: catalogSearchScore(product, normalizedQuery, tokens, requireEveryToken),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.product.rating ?? 0) - (a.product.rating ?? 0))
    .map(({ product }) => product);
  const exactMatches = rankMatches(true);
  const matches = exactMatches.length > 0 || tokens.length === 1
    ? exactMatches
    : rankMatches(false);

  return {
    products: matches.slice(skip, skip + limit),
    total: matches.length,
    skip,
    limit,
  };
}

function catalogSearchScore(
  product: CatalogProduct,
  query: string,
  tokens: string[],
  requireEveryToken: boolean
) {
  const title = normalizeSearchText(product.title ?? "");
  const brand = normalizeSearchText(product.brand ?? "");
  const category = normalizeSearchText(product.category ?? "");
  const tags = normalizeSearchText((product.tags ?? []).join(" "));
  const description = normalizeSearchText(product.description ?? "");
  const searchable = `${title} ${brand} ${category} ${tags} ${description}`;
  const matchedTokens = tokens.filter((token) => searchable.includes(token));
  if (matchedTokens.length === 0) return 0;
  if (requireEveryToken && matchedTokens.length !== tokens.length) return 0;

  return (
    matchedTokens.length * 10 +
    (title === query ? 100 : 0) +
    (title.includes(query) ? 50 : 0) +
    (brand.includes(query) ? 35 : 0) +
    (category.includes(query) ? 30 : 0) +
    (tags.includes(query) ? 20 : 0) +
    tokens.reduce(
      (score, token) =>
        score +
        (title.includes(token) ? 12 : 0) +
        (brand.includes(token) ? 8 : 0) +
        (category.includes(token) ? 7 : 0) +
        (tags.includes(token) ? 5 : 0) +
        (description.includes(token) ? 2 : 0),
      0
    )
  );
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Fetch a product from the upstream catalog and reduce it to the fields we
 * persist on cart/wishlist/order items. Doubles as validation that the
 * productId actually exists.
 */
export async function fetchProductSnapshot(productId: number): Promise<ProductSnapshot> {
  try {
    const { data } = await dummyjson.get(`/products/${productId}`);
    return {
      productId: data.id,
      title: data.title,
      price: data.price,
      thumbnail: data.thumbnail ?? "",
      rating: data.rating ?? 0,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw ApiError.notFound(`Product ${productId} not found`);
    }
    throw new ApiError(502, "Failed to reach the product service");
  }
}
