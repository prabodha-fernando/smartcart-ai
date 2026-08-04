import { z } from "zod";

const limitedProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  price: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  thumbnail: z.string().url(),
});

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1000),
  })).min(1).max(20),
  lastProducts: z.array(limitedProductSchema).max(20).default([]),
}).strict();

export const whyBuySchema = z.object({
  product: z.object({
    title: z.string().max(200).optional(),
    price: z.number().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    description: z.string().max(2000).optional(),
    category: z.string().max(100).optional(),
    brand: z.string().max(100).optional(),
    stock: z.number().int().nonnegative().optional(),
    discountPercentage: z.number().optional(),
    tags: z.array(z.string().max(100)).max(30).optional(),
    warrantyInformation: z.string().max(300).optional(),
    shippingInformation: z.string().max(300).optional(),
    availabilityStatus: z.string().max(100).optional(),
  }).strict(),
  variation: z.number().int().min(0).max(2).default(0),
}).strict();

export type AiChatInput = z.infer<typeof aiChatSchema>;
export type WhyBuyInput = z.infer<typeof whyBuySchema>;
