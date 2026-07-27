import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  checkoutCart,
  getOrderForUser,
  getOrdersForUser,
} from "../services/order.service.js";
import type {
  ListOrdersQueryInput,
  OrderIdParamInput,
} from "../validators/order.validator.js";

function getUserId(userId?: string) {
  if (!userId) {
    throw ApiError.unauthorized("Unauthorized");
  }

  return userId;
}

/**
 * POST /orders — checkout. Converts the current cart into an order, snapshots
 * item prices at time of purchase, then empties the cart.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const order = await checkoutCart(getUserId(req.userId));

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: { order },
  });
});

/** GET /orders — the user's orders, newest first, paginated. */
export const listOrders = asyncHandler(async (req, res) => {
  const result = await getOrdersForUser(
    getUserId(req.userId),
    req.query as unknown as ListOrdersQueryInput
  );

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: result,
  });
});

/** GET /orders/:id — order detail, scoped to the owner. */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params as OrderIdParamInput;
  const order = await getOrderForUser(getUserId(req.userId), id);

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: { order },
  });
});
