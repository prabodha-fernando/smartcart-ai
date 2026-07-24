import { Wishlist, type IWishlist } from "../models/Wishlist.js";
import type { HydratedDocument } from "mongoose";

export class WishlistRepository {
  static async findByUserId(userId: string): Promise<HydratedDocument<IWishlist> | null> {
    return Wishlist.findOne({ user: userId });
  }

  static async create(userId: string): Promise<HydratedDocument<IWishlist>> {
    return Wishlist.create({ user: userId, items: [] });
  }

  static async save(wishlist: HydratedDocument<IWishlist>): Promise<HydratedDocument<IWishlist>> {
    return wishlist.save();
  }
}
