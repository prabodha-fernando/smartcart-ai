import { z } from "zod";

export const addWishlistItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  note: z.string().max(500).optional(),
});
