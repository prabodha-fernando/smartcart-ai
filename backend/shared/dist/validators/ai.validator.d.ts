import { z } from "zod";
export declare const aiChatSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">;
    lastProducts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        title: z.ZodString;
        price: z.ZodNumber;
        rating: z.ZodNumber;
        thumbnail: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        title: string;
        price: number;
        thumbnail: string;
        rating: number;
    }, {
        id: number;
        title: string;
        price: number;
        thumbnail: string;
        rating: number;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
    lastProducts: {
        id: number;
        title: string;
        price: number;
        thumbnail: string;
        rating: number;
    }[];
}, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
    lastProducts?: {
        id: number;
        title: string;
        price: number;
        thumbnail: string;
        rating: number;
    }[] | undefined;
}>;
export declare const whyBuySchema: z.ZodObject<{
    product: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        rating: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodString>;
        stock: z.ZodOptional<z.ZodNumber>;
        discountPercentage: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        warrantyInformation: z.ZodOptional<z.ZodString>;
        shippingInformation: z.ZodOptional<z.ZodString>;
        availabilityStatus: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        description?: string | undefined;
        title?: string | undefined;
        price?: number | undefined;
        rating?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        stock?: number | undefined;
        discountPercentage?: number | undefined;
        tags?: string[] | undefined;
        warrantyInformation?: string | undefined;
        shippingInformation?: string | undefined;
        availabilityStatus?: string | undefined;
    }, {
        description?: string | undefined;
        title?: string | undefined;
        price?: number | undefined;
        rating?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        stock?: number | undefined;
        discountPercentage?: number | undefined;
        tags?: string[] | undefined;
        warrantyInformation?: string | undefined;
        shippingInformation?: string | undefined;
        availabilityStatus?: string | undefined;
    }>;
    variation: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    product: {
        description?: string | undefined;
        title?: string | undefined;
        price?: number | undefined;
        rating?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        stock?: number | undefined;
        discountPercentage?: number | undefined;
        tags?: string[] | undefined;
        warrantyInformation?: string | undefined;
        shippingInformation?: string | undefined;
        availabilityStatus?: string | undefined;
    };
    variation: number;
}, {
    product: {
        description?: string | undefined;
        title?: string | undefined;
        price?: number | undefined;
        rating?: number | undefined;
        category?: string | undefined;
        brand?: string | undefined;
        stock?: number | undefined;
        discountPercentage?: number | undefined;
        tags?: string[] | undefined;
        warrantyInformation?: string | undefined;
        shippingInformation?: string | undefined;
        availabilityStatus?: string | undefined;
    };
    variation?: number | undefined;
}>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type WhyBuyInput = z.infer<typeof whyBuySchema>;
