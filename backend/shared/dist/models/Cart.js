import { Schema, model } from "mongoose";
const cartItemSchema = new Schema({
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: true });
const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });
export const Cart = model("Cart", cartSchema);
