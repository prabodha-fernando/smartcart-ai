import { Router } from "express";
import { validate } from "@smartcart/shared";
import {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} from "@smartcart/shared";
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
