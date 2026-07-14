import { Schema, model, type Types } from "mongoose";

/**
 * One wishlist per user. Items carry the same product snapshot as the cart,
 * plus an optional free-text `note` (the frontend's "favorites" feature lets a
 * user annotate why they saved something).
 */
interface IWishlistItem {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  rating: number;
  note: string;
}

export interface IWishlist {
  user: Types.ObjectId;
  items: IWishlistItem[];
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Wishlist = model<IWishlist>("Wishlist", wishlistSchema);
