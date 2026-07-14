import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { addWishlistItemSchema } from "../validators/wishlist.validator.js";
import { getWishlist, addItem, removeItem } from "../controllers/wishlist.controller.js";

// Mounted behind `requireAuth` in routes/index.ts.
const router = Router();

router.get("/", getWishlist);
router.post("/items", validate({ body: addWishlistItemSchema }), addItem);
router.delete("/items/:productId", removeItem);

export default router;
