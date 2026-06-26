import { create } from "zustand";
import { LoginResponse } from "@/types/user";

interface AuthState {
  user: LoginResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  restoreAuth: () => void;
}

function notifyAuthStorageChanged() {
  window.dispatchEvent(new Event("auth-storage"));
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  login: (data) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    notifyAuthStorageChanged();

    set({
      user: data,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

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

    set({
      accessToken,
      refreshToken,
    });
  },
}));