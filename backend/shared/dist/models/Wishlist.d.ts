import { type Types } from "mongoose";
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
export declare const Wishlist: import("mongoose").Model<IWishlist, {}, {}, {}, import("mongoose").Document<unknown, {}, IWishlist, {}, {}> & IWishlist & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>;
