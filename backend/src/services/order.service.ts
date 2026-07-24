import mongoose, { type ClientSession, type HydratedDocument } from "mongoose";
import { type IOrder } from "../models/Order.js";
import { AppError } from "../utils/AppError.js";
import type { ListOrdersQueryInput } from "../validators/order.validator.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { CartRepository } from "../repositories/cart.repository.js";

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
  const cart = await CartRepository.findByUserId(userId, session);

  if (!cart || cart.items.length === 0) {
    throw AppError.badRequest("Cannot create order from an empty cart");
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
  
  const order = await OrderRepository.create(orderData, session);
  if (!order) throw new Error("Order creation failed");

  cart.items.splice(0, cart.items.length);
  await CartRepository.save(cart, session);

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
  const skip = (page - 1) * limit;
  const { orders, total } = await OrderRepository.findPaginatedByUserId(userId, skip, limit);

  return {
    orders: orders.map(serializeOrder),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await OrderRepository.findByIdAndUserId(orderId, userId);

  if (!order) {
    throw AppError.notFound("Order not found");
  }

  return serializeOrder(order);
}
