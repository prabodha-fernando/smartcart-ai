import axios from "axios";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Products stay sourced from DummyJSON, but every call goes through this
 * backend rather than the browser. This client is shared by the product proxy
 * routes and by cart/wishlist (which snapshot product details at add-time).
 */
export const dummyjson = axios.create({
  baseURL: env.DUMMYJSON_BASE_URL,
  timeout: 10_000,
});

export interface ProductSnapshot {
  productId: number;
  title: string;
  price: number;
  thumbnail: string;
  rating: number;
}

/**
 * Fetch a product from the upstream catalog and reduce it to the fields we
 * persist on cart/wishlist/order items. Doubles as validation that the
 * productId actually exists.
 */
export async function fetchProductSnapshot(productId: number): Promise<ProductSnapshot> {
  try {
    const { data } = await dummyjson.get(`/products/${productId}`);
    return {
      productId: data.id,
      title: data.title,
      price: data.price,
      thumbnail: data.thumbnail ?? "",
      rating: data.rating ?? 0,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw ApiError.notFound(`Product ${productId} not found`);
    }
    throw new ApiError(502, "Failed to reach the product service");
  }
}
