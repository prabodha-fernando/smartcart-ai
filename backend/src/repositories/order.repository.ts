import { Order, type IOrder } from "../models/Order.js";
import type { HydratedDocument, ClientSession } from "mongoose";

export class OrderRepository {
  static async create(orderData: any, session?: ClientSession | null): Promise<HydratedDocument<IOrder>> {
    if (session) {
      const orders = await Order.create([orderData], { session });
      return orders[0];
    }
    return Order.create(orderData);
  }

  static async findPaginatedByUserId(userId: string, skip: number, limit: number) {
    const [orders, total] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ user: userId }),
    ]);
    return { orders, total };
  }

  static async findByIdAndUserId(orderId: string, userId: string): Promise<HydratedDocument<IOrder> | null> {
    return Order.findOne({ _id: orderId, user: userId });
  }
}
