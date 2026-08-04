import { type Types } from "mongoose";
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
export declare const Cart: import("mongoose").Model<ICart, {}, {}, {}, import("mongoose").Document<unknown, {}, ICart, {}, {}> & ICart & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>;
