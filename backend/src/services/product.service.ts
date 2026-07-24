import { type IProduct } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { CategoryRepository } from "../repositories/category.repository.js";

export interface ProductSnapshot {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  rating: number;
}

export type CatalogProduct = IProduct;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

function getSortObj(sort?: string) {
  switch (sort) {
    case "price_asc": return { price: 1 };
    case "price_desc": return { price: -1 };
    case "rating": return { rating: -1 };
    default: return { id: 1 };
  }
}

async function listProductsFromDb(page = 1, limit = 30, sort?: string): Promise<PaginatedResult<IProduct>> {
  const skip = (page - 1) * limit;
  const { data, total } = await ProductRepository.findPaginated({}, getSortObj(sort) as any, skip, limit);
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
}

async function searchCatalogFromDb(query: string, page = 1, limit = 100, sort?: string): Promise<PaginatedResult<IProduct>> {
  if (!query.trim()) return { data: [], pagination: { page, limit, total: 0, totalPages: 1 } };
  const filter = { $text: { $search: query } };

  let sortObj: any = { score: { $meta: "textScore" } };
  if (sort) {
    sortObj = getSortObj(sort);
  }

  const skip = (page - 1) * limit;
  const isTextSearch = !sort;
  const { data, total } = await ProductRepository.searchPaginated(filter, sortObj, skip, limit, isTextSearch);
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
}

async function getProductsByCategoryFromDb(category: string, page = 1, limit = 30, sort?: string): Promise<PaginatedResult<IProduct>> {
  const skip = (page - 1) * limit;
  const { data, total } = await ProductRepository.findPaginated({ category }, getSortObj(sort) as any, skip, limit);
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
}

function toCategoryName(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Simple in-memory cache
const cache = new Map<string, { expires: number, data: any }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProductCategoriesFromDb() {
  const cacheKey = "categories";
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  let result;
  const categories = await CategoryRepository.findAll();
  if (categories.length > 0) {
    result = categories.map(({ slug, name }) => ({
      slug,
      name: name || toCategoryName(slug),
      url: `/api/products/category/${slug}`,
    }));
  } else {
    // Fallback
    const slugs = await ProductRepository.findDistinctCategories();
    result = slugs.sort().map((slug) => ({
      slug,
      name: toCategoryName(slug),
      url: `/api/products/category/${slug}`,
    }));
  }

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL, data: result });
  return result;
}

async function getProductByIdFromDb(productId: number) {
  const product = await ProductRepository.findById(productId);
  if (!product) throw AppError.notFound(`Product ${productId} not found`);
  return product;
}

export async function updateProductInDb(productId: number, updates: Partial<IProduct>) {
  const product = await ProductRepository.updateById(productId, updates);
  if (!product) throw AppError.notFound(`Product ${productId} not found`);
  return product;
}

export async function fetchProductSnapshot(productId: number): Promise<ProductSnapshot> {
  const product = await getProductById(productId);
  return {
    productId: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    rating: product.rating,
  };
}

/**
 * Database-backed catalog gateway. It preserves one catalog interface for
 * product browsing, carts, wishlists, and AI while keeping all data in MongoDB.
 */
export const catalogDb = {
  async get(
    path: string,
    options?: { params?: Record<string, unknown> }
  ): Promise<{ data: any }> {
    const params = options?.params ?? {};

    // AI service might still pass 'skip', we need to convert it to page
    let page = readNumber(params.page, 1);
    const limit = readNumber(params.limit, 30);
    const sort = typeof params.sort === "string" ? params.sort : undefined;

    if (params.skip !== undefined && params.page === undefined) {
      page = Math.floor(readNumber(params.skip, 0) / limit) + 1;
    }

    if (path === "/products") {
      return { data: await listProductsFromDb(page, limit === 0 ? 10_000 : limit, sort) };
    }
    if (path === "/products/search") {
      return { data: await searchCatalogFromDb(String(params.q ?? ""), page, limit, sort) };
    }
    if (path === "/products/categories") {
      return { data: await getProductCategoriesFromDb() };
    }
    if (path.startsWith("/products/category/")) {
      return { data: await getProductsByCategoryFromDb(decodeURIComponent(path.slice(19)), page, limit, sort) };
    }
    if (/^\/products\/\d+$/.test(path)) {
      return { data: await getProductByIdFromDb(Number(path.slice(10))) };
    }
    throw AppError.notFound("Product catalog route not found");
  },
};

export async function listProducts(page = 1, limit = 30, sort?: string) {
  return (await catalogDb.get("/products", { params: { page, limit, sort } })).data;
}

export async function searchCatalog(query: string, page = 1, limit = 100, sort?: string) {
  return (await catalogDb.get("/products/search", { params: { q: query, page, limit, sort } })).data;
}

export async function getProductsByCategory(category: string, page = 1, limit = 30, sort?: string) {
  return (await catalogDb.get(`/products/category/${encodeURIComponent(category)}`, { params: { page, limit, sort } })).data;
}

export async function getProductCategories() {
  return (await catalogDb.get("/products/categories")).data;
}

export async function getProductById(productId: number) {
  return (await catalogDb.get(`/products/${productId}`)).data;
}

function readNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
