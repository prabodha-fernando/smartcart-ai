import { Schema, model, type Types } from "mongoose";

/**
 * An immutable snapshot of a purchase. Item titles/prices are copied from the
 * cart at checkout time so the order still reads correctly even if the upstream
 * product later changes price or disappears.
 */
interface IOrderItem {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Number, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    thumbnail: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order = model<IOrder>("Order", orderSchema);
