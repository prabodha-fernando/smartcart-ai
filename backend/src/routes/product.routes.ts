import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { dummyjson } from "../services/product.service.js";
import { searchCatalog } from "../services/product.service.js";

/**
 * Read-only proxy for the DummyJSON catalog. The frontend talks to this backend
 * for everything; product data just happens to be sourced upstream. Public
 * (browsing doesn't require auth). Specific paths are declared before `/:id`
 * so they aren't swallowed by the wildcard.
 */
const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data } = await dummyjson.get("/products", { params: req.query });
    res.json(data);
  })
);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const skip = parseBoundedInteger(req.query.skip, 0, 0, 10_000);
    const limit = parseBoundedInteger(req.query.limit, 100, 1, 100);
    res.json(await searchCatalog(query, skip, limit));
  })
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const { data } = await dummyjson.get("/products/categories");
    res.json(data);
  })
);

router.get(
  "/category/:category",
  asyncHandler(async (req, res) => {
    const { data } = await dummyjson.get(`/products/category/${req.params.category}`, {
      params: req.query,
    });
    res.json(data);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data } = await dummyjson.get(`/products/${req.params.id}`);
    res.json(data);
  })
);

export default router;

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
