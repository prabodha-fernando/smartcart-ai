import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LoginResponse, User } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;

  login: (user: User, tokens: LoginResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

function notifyAuthStorageChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage"));
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,

      login: (user, tokens) => {
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        notifyAuthStorageChanged();
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        notifyAuthStorageChanged();
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
        notifyAuthStorageChanged();
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: "smartcart-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
