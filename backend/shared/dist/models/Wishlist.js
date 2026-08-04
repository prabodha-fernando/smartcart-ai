import { Schema, model } from "mongoose";
const wishlistItemSchema = new Schema({
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: "" },
}, { _id: false });
const wishlistSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
}, { timestamps: true });
export const Wishlist = model("Wishlist", wishlistSchema);
