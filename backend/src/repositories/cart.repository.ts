import { Cart, type ICart } from "../models/Cart.js";
import type { HydratedDocument, ClientSession } from "mongoose";

export class CartRepository {
  static async findByUserId(userId: string, session?: ClientSession | null): Promise<HydratedDocument<ICart> | null> {
    const query = Cart.findOne({ user: userId });
    if (session) query.session(session);
    return query;
  }

  static async create(userId: string): Promise<HydratedDocument<ICart>> {
    return Cart.create({ user: userId, items: [] });
  }

  static async save(cart: HydratedDocument<ICart>, session?: ClientSession | null): Promise<HydratedDocument<ICart>> {
    return cart.save(session ? { session } : undefined);
  }
}
