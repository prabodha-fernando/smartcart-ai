import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import CryptoJS from "crypto-js";
import { LoginResponse, User } from "@/types/user";

const encryptedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key";
      const bytes = CryptoJS.AES.decrypt(str, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    const key = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key";
    const encrypted = CryptoJS.AES.encrypt(value, key).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

function isJwtLike(token: string | null): boolean {
  return !!token && token.split(".").length === 3;
}

export function hasBackendSession() {
  const { accessToken, refreshToken } = useAuthStore.getState();

  return isJwtLike(accessToken) && isJwtLike(refreshToken);
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;

  login: (user: User, tokens: LoginResponse) => void;
  updateUser: (updates: Partial<User>) => void;
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

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        }));
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
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (
          state?.accessToken &&
          (!isJwtLike(state.accessToken) || !isJwtLike(state.refreshToken))
        ) {
          state.logout();
        }

        state?.setHasHydrated(true);
      },
    }
  )
);
