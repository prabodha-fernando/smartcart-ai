import { z } from "zod";

export const orderIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order id"),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type OrderIdParamInput = z.infer<typeof orderIdParamSchema>;
export type ListOrdersQueryInput = z.infer<typeof listOrdersQuerySchema>;
