import mongoose, { type ClientSession, type HydratedDocument } from "mongoose";
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
    lineTotal: number;
  }>;
  subtotal: number;
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
      lineTotal: item.lineTotal,
    })),
    subtotal: object.subtotal,
    total: object.total,
    status: object.status,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
}

export async function checkoutCart(userId: string) {
  const session = await mongoose.startSession();
  try {
    let result: SerializedOrder | undefined;
    await session.withTransaction(async () => {
      result = await persistCheckout(userId, session);
    });
    if (!result) throw new Error("Checkout transaction did not complete");
    return result;
  } catch (error) {
    // Local standalone MongoDB does not support transactions. Preserve the
    // required create-then-clear ordering there; production replica sets use
    // the atomic transaction above.
    if (isTransactionUnsupported(error)) {
      return persistCheckout(userId);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function persistCheckout(userId: string, session?: ClientSession) {
  const cart = await Cart.findOne({ user: userId }).session(session ?? null);

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Cannot create order from an empty cart");
  }

  const items = cart.items.map((item) => ({
    productId: item.productId,
    title: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
    lineTotal: Number((item.price * item.quantity).toFixed(2)),
  }));
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );
  const total = subtotal;
  const orderData = {
    user: userId,
    items,
    subtotal,
    total,
    status: "pending",
  } as const;
  const order = session
    ? (await Order.create([orderData], { session }))[0]
    : await Order.create(orderData);
  if (!order) throw new Error("Order creation failed");

  cart.items.splice(0, cart.items.length);
  await cart.save(session ? { session } : undefined);

  return serializeOrder(order);
}

function isTransactionUnsupported(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 20
  );
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
