import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FavoriteItem, LimitedProduct } from "@/types/product";

interface FavoritesState {
  favorites: FavoriteItem[];
  hasHydrated: boolean;

  addFavorite: (product: LimitedProduct) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (product: LimitedProduct) => void;
  updateNote: (id: number, note: string) => void;
  clearFavorites: () => void;
  isFavorite: (id: number) => boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      hasHydrated: false,

      // CREATE
      addFavorite: (product) => {
        const exists = get().favorites.some((item) => item.id === product.id);

        if (!exists) {
          set((state) => ({
            favorites: [
              ...state.favorites,
              { ...product, addedAt: Date.now() },
            ],
          }));
        }
      },

      // DELETE (single)
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

      // UPDATE (personal note)
      updateNote: (id, note) => {
        const trimmed = note.trim();

        set((state) => ({
          favorites: state.favorites.map((item) =>
            item.id === id
              ? { ...item, note: trimmed || undefined }
              : item
          ),
        }));
      },

      // DELETE (all)
      clearFavorites: () => set({ favorites: [] }),

      // READ helper
      isFavorite: (id) => get().favorites.some((item) => item.id === id),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "smartcart-favorites",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favorites: state.favorites }),
      // Backfill addedAt for favorites saved before this field existed so the
      // recency sort has a stable value to work with.
      migrate: (persisted, version) => {
        const state = persisted as { favorites?: Partial<FavoriteItem>[] };

        if (version < 1 && Array.isArray(state?.favorites)) {
          const base = Date.now();
          state.favorites = state.favorites.map((item, index) => ({
            ...item,
            addedAt: item.addedAt ?? base - index,
          }));
        }

        return state as { favorites: FavoriteItem[] };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
