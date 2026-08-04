import { z } from "zod";
export declare const addWishlistItemSchema: z.ZodObject<{
    productId: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    productId: number;
}, {
    productId: number;
}>;
export declare const wishlistItemParamSchema: z.ZodObject<{
    productId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: number;
}, {
    productId: number;
}>;
export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type WishlistItemParamInput = z.infer<typeof wishlistItemParamSchema>;
