import { Schema, model, type Types } from "mongoose";

export interface IWishlistItem {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
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
