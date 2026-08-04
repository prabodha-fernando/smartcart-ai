import { Router } from "express";
import { validate } from "@smartcart/shared";
import {
  addWishlistItemSchema,
  wishlistItemParamSchema,
} from "@smartcart/shared";
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
