import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  addWishlistItemSchema,
  wishlistItemParamSchema,
} from "../validators/wishlist.validator.js";
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
} from "../controllers/wishlist.controller.js";

// Mounted behind `requireAuth` in routes/index.ts.
const router = Router();

router.get("/", getWishlist);
router.post(
  "/items",
  validate({ body: addWishlistItemSchema }),
  addWishlistItem
);
router.delete(
  "/items/:productId",
  validate({ params: wishlistItemParamSchema }),
  removeWishlistItem
);

export default router;
