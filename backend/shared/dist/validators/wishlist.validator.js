import { z } from "zod";
export const addWishlistItemSchema = z
    .object({
    productId: z.number().int().positive(),
})
    .strict();
export const wishlistItemParamSchema = z.object({
    productId: z.coerce.number().int().positive(),
});
