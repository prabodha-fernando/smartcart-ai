import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";

/**
 * POST /orders — checkout. Converts the current cart into an order, snapshots
 * item prices at time of purchase, then empties the cart.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.userId });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cannot checkout an empty cart");
  }

  const items = cart.items.map((i) => ({
    productId: i.productId,
    title: i.title,
    price: i.price,
    thumbnail: i.thumbnail,
    quantity: i.quantity,
  }));
  const total = Number(items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2));

  const order = await Order.create({ user: req.userId, items, total, status: "paid" });

  cart.items.splice(0, cart.items.length);
  await cart.save();

  res.status(201).json(order.toJSON());
});

/** GET /orders — the user's orders, newest first, paginated. */
export const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  const [orders, total] = await Promise.all([
    Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: req.userId }),
  ]);

  res.json({
    orders: orders.map((o) => o.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

/** GET /orders/:id — order detail, scoped to the owner. */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw ApiError.notFound("Order not found");
  res.json(order.toJSON());
});
