import { Schema, model, type Types } from "mongoose";

/**
 * One cart per user (enforced by the unique index on `user`). Each line item
 * stores a snapshot of the product's display fields taken at add-time, so
 * reading the cart is a single DB round-trip with no upstream fan-out.
 */
export interface ICartItem {
  _id: Types.ObjectId;
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Cart = model<ICart>("Cart", cartSchema);
