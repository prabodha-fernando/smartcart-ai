import { type Types } from "mongoose";
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
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export interface IOrder {
    user: Types.ObjectId;
    items: IOrderItem[];
    subtotal: number;
    total: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Order: import("mongoose").Model<IOrder, {}, {}, {}, import("mongoose").Document<unknown, {}, IOrder, {}, {}> & IOrder & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>;
export {};
