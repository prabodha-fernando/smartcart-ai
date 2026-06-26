import { create } from "zustand";
import { Product } from "@/types/product";

interface FavoritesState {
  favorites: Product[];

  addFavorite: (product: Product) => void;

  removeFavorite: (id: number) => void;

  isFavorite: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesState>(
  (set, get) => ({
    favorites: [],

    addFavorite: (product) => {
      const exists = get().favorites.some(
        (item) => item.id === product.id
      );

      if (!exists) {
        set((state) => ({
          favorites: [...state.favorites, product],
        }));
      }
    },

    removeFavorite: (id) => {
      set((state) => ({
        favorites: state.favorites.filter(
          (item) => item.id !== id
        ),
      }));
    },

    isFavorite: (id) => {
      return get().favorites.some(
        (item) => item.id === id
      );
    },
  })
);