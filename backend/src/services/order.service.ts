import type { HydratedDocument } from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order, type IOrder } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import type { ListOrdersQueryInput } from "../validators/order.validator.js";

export interface SerializedOrder {
  id: string;
  items: Array<{
    productId: number;
    title: string;
    price: number;
    thumbnail: string;
    quantity: number;
  }>;
  total: number;
  status: IOrder["status"];
  createdAt?: Date;
  updatedAt?: Date;
}

function serializeOrder(order: HydratedDocument<IOrder>): SerializedOrder {
  const object = order.toObject();

  return {
    id: order.id as string,
    items: object.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      thumbnail: item.thumbnail,
      quantity: item.quantity,
    })),
    total: object.total,
    status: object.status,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
}

export async function checkoutCart(userId: string) {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cannot checkout an empty cart");
  }

  const items = cart.items.map((item) => ({
    productId: item.productId,
    title: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
  }));
  const total = Number(
    items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );
  const order = await Order.create({
    user: userId,
    items,
    total,
    status: "paid",
  });

  cart.items.splice(0, cart.items.length);
  await cart.save();

  return serializeOrder(order);
}

export async function getOrdersForUser(
  userId: string,
  query: ListOrdersQueryInput
) {
  const { page, limit } = query;
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders: orders.map(serializeOrder),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return serializeOrder(order);
}
