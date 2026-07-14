import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();
const TOKEN_EXPIRY_GRACE_SECONDS = 10;

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const privateApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

function getJwtExpiry(token: string | null): number | null {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: unknown };

    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isExpiredOrInvalid(token: string | null): boolean {
  const exp = getJwtExpiry(token);

  if (!exp) return true;

  return exp <= Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_GRACE_SECONDS;
}

let refreshPromise: Promise<string> | null = null;

async function getFreshAccessToken() {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!accessToken || !refreshToken) {
    return null;
  }

  if (!isExpiredOrInvalid(accessToken)) {
    return accessToken;
  }

  if (isExpiredOrInvalid(refreshToken)) {
    logout();
    return null;
  }

  refreshPromise ??= publicApi
    .post("/auth/refresh", { refreshToken })
    .then((response) => {
      const newAccessToken = response.data.data.accessToken as string;
      setTokens(newAccessToken, refreshToken);
      return newAccessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// REQUEST INTERCEPTOR
privateApi.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const token = await getFreshAccessToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const response = await publicApi.post("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = response.data.data.accessToken;

        useAuthStore.getState().setTokens(newAccessToken, refreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return privateApi(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
