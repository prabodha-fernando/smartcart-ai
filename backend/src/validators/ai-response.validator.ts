import { z } from "zod";

// The subset of allowed categories from the catalog
export const allowedCategories = new Set([
  "beauty", "fragrances", "furniture", "groceries", "home-decoration",
  "kitchen-accessories", "laptops", "mens-shirts", "mens-shoes",
  "mens-watches", "mobile-accessories", "motorcycle", "skin-care",
  "smartphones", "sports-accessories", "sunglasses", "tablets", "tops",
  "vehicle", "womens-bags", "womens-dresses", "womens-jewellery",
  "womens-shoes", "womens-watches",
]);

// Helper to gracefully catch parsing errors and fallback to null
const nullFallback = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().catch(null);

export const searchPlanSchema = z.object({
  query: z.string().trim().max(80).catch("").transform((val) => val || null),
  categories: z.array(z.string())
    .catch([])
    .transform((categories) => 
      categories
        .filter((c) => allowedCategories.has(c))
        .slice(0, 3)
    ),
  brand: z.string().trim().max(80).catch("").transform((val) => val || null),
  color: z.string().trim().max(40).catch("").transform((val) => val || null),
  purpose: z.string().trim().max(80).catch("").transform((val) => val || null),
  minPrice: nullFallback(z.number().nonnegative()),
  maxPrice: nullFallback(z.number().nonnegative()),
  minRating: nullFallback(z.number().min(0).max(5)),
  minDiscount: nullFallback(z.number().min(0).max(100)),
  inStock: nullFallback(z.boolean()),
  sort: nullFallback(
    z.enum(["price_asc", "price_desc", "rating", "best_selling", "discount", "newest"])
  ),
  limit: z.number().int().min(1).max(4).catch(4),
});

export type SearchPlan = z.infer<typeof searchPlanSchema>;

export const shoppingDecisionResponseSchema = z.object({
  intent: z
    .enum(["product_search", "product_question", "app_question", "out_of_scope"])
    .catch("product_search"),
  requiresProducts: z.boolean().catch(true),
  reply: z.string().trim().catch(""),
  search: searchPlanSchema.default({}), // default to empty search plan if missing
});

export const categorySelectionResponseSchema = z.object({
  categories: z.array(z.string())
    .catch([])
    .transform((categories) => 
      categories
        .filter((c) => allowedCategories.has(c))
        .slice(0, 3)
    ),
});

export const productSelectionResponseSchema = z.object({
  productIds: z.array(z.number().int().positive()).catch([]),
});
