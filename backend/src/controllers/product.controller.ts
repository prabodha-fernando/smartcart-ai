import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getProductById,
  getProductCategories,
  getProductsByCategory,
  listProducts,
  searchCatalog,
  updateProductInDb,
} from "../services/product.service.js";

function parseBoundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : fallback;
}

function parseSort(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (["price_asc", "price_desc", "rating"].includes(value)) return value;
  return undefined;
}

export const getCatalog = asyncHandler(async (req, res) => {
  const page = parseBoundedInteger(req.query.page, 1, 1, 10_000);
  const limit = parseBoundedInteger(req.query.limit, 30, 1, 100);
  const sort = parseSort(req.query.sort);
  const products = await listProducts(page, limit, sort);
  res.json(products);
});

export const searchProducts = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const page = parseBoundedInteger(req.query.page, 1, 1, 10_000);
  const limit = parseBoundedInteger(req.query.limit, 100, 1, 100);
  const sort = parseSort(req.query.sort);
  const products = await searchCatalog(query, page, limit, sort);
  res.json(products);
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await getProductCategories();
  res.json(categories);
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  const page = parseBoundedInteger(req.query.page, 1, 1, 10_000);
  const limit = parseBoundedInteger(req.query.limit, 30, 1, 100);
  const sort = parseSort(req.query.sort);
  const products = await getProductsByCategory(req.params.category, page, limit, sort);
  res.json(products);
});

export const getProduct = asyncHandler(async (req, res) => {
  const id = parseBoundedInteger(req.params.id, -1, 1, Number.MAX_SAFE_INTEGER);
  const product = await getProductById(id);
  res.json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const id = parseBoundedInteger(req.params.id, -1, 1, Number.MAX_SAFE_INTEGER);
  // Optional: check admin auth here. For this exercise, we just update it.
  const updates = req.body;
  const updatedProduct = await updateProductInDb(id, updates);
  res.json(updatedProduct);
});
