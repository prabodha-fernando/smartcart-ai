import { Router } from "express";
import {
  getCatalog,
  getCategories,
  getCategoryProducts,
  getProduct,
  searchProducts,
  updateProduct,
} from "../controllers/product.controller.js";

/**
 * MongoDB product catalog. Public browsing does not require auth.
 * Note: PUT /:id should ideally have admin auth, but kept open for this exercise.
 */
const router = Router();

router.get("/", getCatalog);
router.get("/search", searchProducts);
router.get("/categories", getCategories);
router.get("/category/:category", getCategoryProducts);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);

export default router;
