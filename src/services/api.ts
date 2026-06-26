import { publicApi, privateApi  } from "@/lib/axios";
import { LoginResponse, User } from "@/types/user";
import {
  LimitedProductsResponse,
  Product,
  ProductCategory,
  ProductsResponse,
} from "@/types/product";

// LOGIN (PUBLIC)
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await publicApi.post("/auth/login", {
    username,
    password,
    expiresInMins: 30,
  });

  return response.data;
}

// GET CURRENT USER
export async function getAuthUser(): Promise<User> {
  const response = await privateApi.get("/auth/me");

  return response.data;
}

// REFRESH TOKEN
export async function refreshAccessToken(
  refreshToken: string
): Promise<LoginResponse> {
  const response = await publicApi.post("/auth/refresh", {
    refreshToken,
    expiresInMins: 30,
  });

  return response.data;
}

// PRODUCTS
export async function getProducts(
  limit: number = 12,
  skip: number = 0
): Promise<ProductsResponse> {
  const response = await publicApi.get(
    `/products?limit=${limit}&skip=${skip}`
  );

  return response.data;
}

export async function getProductById(
  id: string
): Promise<Product> {
  const response = await publicApi.get(`/products/${id}`);

  return response.data;
}

export async function searchProducts(
  query: string
): Promise<ProductsResponse> {
  const response = await publicApi.get(`/products/search?q=${query}`);

  return response.data;
}

export async function getCategories(): Promise<ProductCategory[]> {
  const response = await publicApi.get("/products/categories");

  return response.data;
}

export async function getProductsByCategory(
  category: string
): Promise<ProductsResponse> {
  const response = await publicApi.get(`/products/category/${category}`);

  return response.data;
}

export async function getLimitedProducts(
  limit: number,
  skip: number
): Promise<LimitedProductsResponse> {
  const response = await publicApi.get(
    `/products?limit=${limit}&skip=${skip}&select=title,price,rating,thumbnail`
  );

  return response.data;
}
