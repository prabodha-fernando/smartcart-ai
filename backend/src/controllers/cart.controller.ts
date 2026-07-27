import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  addItemToCart,
  clearCart as clearUserCart,
  getCartForUser,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/cart.service.js";
import type {
  AddCartItemInput,
  CartItemParamInput,
  UpdateCartItemInput,
} from "../validators/cart.validator.js";

function getUserId(userId?: string) {
  if (!userId) {
    throw ApiError.unauthorized("Unauthorized");
  }

  return userId;
}

/** GET /cart */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getCartForUser(getUserId(req.userId));

  res.status(200).json({
    success: true,
    message: "Cart fetched successfully",
    data: { cart },
  });
});

/** POST /cart/items — add a product (or bump its quantity if already present). */
export const addItem = asyncHandler(async (req, res) => {
  const cart = await addItemToCart(
    getUserId(req.userId),
    req.body as AddCartItemInput
  );

  res.status(201).json({
    success: true,
    message: "Item added to cart",
    data: { cart },
  });
});

/** PATCH /cart/items/:id — set an item's quantity. */
export const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params as CartItemParamInput;
  const cart = await updateCartItemQuantity(
    getUserId(req.userId),
    id,
    req.body as UpdateCartItemInput
  );

  res.status(200).json({
    success: true,
    message: "Cart item updated",
    data: { cart },
  });
});

/** DELETE /cart/items/:id — remove one line item. */
export const removeItem = asyncHandler(async (req, res) => {
  const { id } = req.params as CartItemParamInput;
  const cart = await removeCartItem(getUserId(req.userId), id);

  res.status(200).json({
    success: true,
    message: "Cart item removed",
    data: { cart },
  });
});

/** DELETE /cart — empty the cart. */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await clearUserCart(getUserId(req.userId));

  res.status(200).json({
    success: true,
    message: "Cart cleared",
    data: { cart },
  });
});
