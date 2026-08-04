import { z } from "zod";
export const addCartItemSchema = z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive().default(1),
});
export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().positive(),
});
export const cartItemParamSchema = z.object({
    id: z.string().min(1, "Cart item id is required"),
});
