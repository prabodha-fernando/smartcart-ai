import { create } from "zustand";
import { LoginResponse, User } from "@/types/user";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  login: (user: User, tokens: LoginResponse) => void;
  logout: () => void;
  restoreAuth: () => void;
}

function notifyAuthStorageChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage"));
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (user, tokens) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    notifyAuthStorageChanged();

    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    notifyAuthStorageChanged();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  restoreAuth: () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    set({
      accessToken,
      refreshToken,
      user: storedUser ? JSON.parse(storedUser) : null,
    });
  },
}));