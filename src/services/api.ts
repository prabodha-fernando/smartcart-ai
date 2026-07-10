import { publicApi, privateApi } from "@/lib/axios";
import {
  AuthApiData,
  AuthApiResponse,
  AuthApiUser,
  CreateAccountPayload,
  LoginResponse,
  RefreshTokenResponse,
  User,
  UsersResponse,
} from "@/types/user";
import {
  LimitedProductsResponse,
  Product,
  ProductCategory,
  ProductsResponse,
} from "@/types/product";

function normalizeAuthUser(user: AuthApiUser): User {
  const name = user.name?.trim() || user.email.split("@")[0];
  const [firstName = name, ...lastNameParts] = name.split(/\s+/);
  const lastName = lastNameParts.join(" ");

  return {
    id: user.id,
    name,
    firstName,
    lastName,
    gender: "other",
    email: user.email,
    phone: "",
    username: user.email,
    image: "",
    role: "customer",
  };
}

function normalizeAuthData(data: AuthApiData): LoginResponse {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: normalizeAuthUser(data.user),
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await publicApi.post<AuthApiResponse<AuthApiData>>(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return normalizeAuthData(response.data.data);
}

export async function getAuthUser(accessToken?: string): Promise<User> {
  const response = await privateApi.get<AuthApiResponse<{ user: AuthApiUser }>>("/auth/me", {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  return normalizeAuthUser(response.data.data.user);
}

export async function getAuthUsers(): Promise<UsersResponse> {
  const response = await publicApi.get("/users");

  return response.data;
}

export async function createAuthUser(
  payload: CreateAccountPayload
): Promise<LoginResponse> {
  const response = await publicApi.post<AuthApiResponse<AuthApiData>>(
    "/auth/register",
    payload
  );

  return normalizeAuthData(response.data.data);
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const response = await publicApi.post<AuthApiResponse<RefreshTokenResponse>>("/auth/refresh", {
    refreshToken,
  });

  return response.data.data;
}

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
  const response = await publicApi.get(
    `/products/search?q=${encodeURIComponent(query)}`
  );

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

export async function getProductsByIds(
  ids: readonly number[]
): Promise<Product[]> {
  const results = await Promise.all(
    ids.map((id) => publicApi.get(`/products/${id}`).then((r) => r.data))
  );

  return results as Product[];
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
