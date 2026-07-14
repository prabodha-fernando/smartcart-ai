"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getAuthUser } from "@/services/api";

export default function StoreSync() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const prev = useRef<{ initialized: boolean; token: string | null }>({
    initialized: false,
    token: null,
  });

  useEffect(() => {
    // Wait for the persisted auth store to rehydrate before deciding anything,
    // otherwise the initial null→token rehydration looks like a fresh login.
    if (!hasHydrated) return;

    const prevToken = prev.current.token;
    const wasInitialized = prev.current.initialized;
    prev.current = { initialized: true, token: accessToken };

    if (!accessToken || !refreshToken) {
      // Just logged out — drop the local mirror. (Nothing to do for a guest
      // who was never signed in.)
      if (wasInitialized && prevToken) {
        useCartStore.getState().resetLocal();
      }
      return;
    }

    const syncStores = async (mode: "hydrate" | "merge") => {
      try {
        await getAuthUser(accessToken);
      } catch {
        useAuthStore.getState().logout();
        useCartStore.getState().resetLocal();
        return;
      }

      if (mode === "hydrate") {
        await useCartStore.getState().syncFromServer();
      } else {
        await useCartStore.getState().mergeLocalIntoServer();
      }
    };

    if (!wasInitialized) {
      // Refresh with an existing session → server is the source of truth.
      void syncStores("hydrate");
    } else if (!prevToken) {
      // Real login during the session → merge the guest cart/favorites up.
      void syncStores("merge");
    }
  }, [hasHydrated, accessToken, refreshToken]);

  return null;
}
