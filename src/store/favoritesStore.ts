import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LimitedProduct } from "@/types/product";

interface FavoritesState {
  favorites: LimitedProduct[];
  hasHydrated: boolean;

  addFavorite: (product: LimitedProduct) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (product: LimitedProduct) => void;
  clearFavorites: () => void;
  isFavorite: (id: number) => boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      hasHydrated: false,

      addFavorite: (product) => {
        const exists = get().favorites.some((item) => item.id === product.id);

        if (!exists) {
          set((state) => ({
            favorites: [...state.favorites, product],
          }));
        }
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== id),
        }));
      },

      toggleFavorite: (product) => {
        if (get().isFavorite(product.id)) {
          get().removeFavorite(product.id);
        } else {
          get().addFavorite(product);
        }
      },

      clearFavorites: () => set({ favorites: [] }),

      isFavorite: (id) => get().favorites.some((item) => item.id === id),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "smartcart-favorites",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favorites: state.favorites }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
