import { useMutation, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  getAuthUser,
  loginUser,
  refreshAccessToken,
} from "@/services/api";

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = localStorage.getItem("accessToken");

  if (accessToken && isExpiredJwt(accessToken)) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }

  return accessToken;
}

function isExpiredJwt(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return true;
  }

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decodedPayload = JSON.parse(atob(paddedBase64));

    if (typeof decodedPayload.exp !== "number") {
      return false;
    }

    return decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function subscribeToAuthStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth-storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth-storage", onStoreChange);
  };
}

function subscribeToHydration(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const frameId = window.requestAnimationFrame(onStoreChange);

  return () => window.cancelAnimationFrame(frameId);
}

export function useLogin() {
  return useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => loginUser(username, password),
  });
}

export function useAuthUser() {
  const accessToken = useAccessToken();

  const query = useQuery({
    queryKey: ["auth-user"],
    queryFn: getAuthUser,
    enabled: !!accessToken,
    retry: false,
  });

  return {
    ...query,
    hasAccessToken: !!accessToken,
    isCheckingToken: false,
  };
}

export function useAccessToken() {
  return useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredAccessToken,
    () => null
  );
}

export function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      refreshAccessToken(refreshToken),
  });
}
