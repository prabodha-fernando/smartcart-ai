import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";
import { getCart, addItem, updateItem, removeItem, clearCart } from "../controllers/cart.controller.js";

// Mounted behind `requireAuth` in routes/index.ts — every handler is user-scoped.
const router = Router();

router.get("/", getCart);
router.post("/items", validate({ body: addCartItemSchema }), addItem);
router.patch(
  "/items/:id",
  validate({ params: cartItemParamSchema, body: updateCartItemSchema }),
  updateItem
);
router.delete("/items/:id", validate({ params: cartItemParamSchema }), removeItem);
router.delete("/", clearCart);

export default router;
