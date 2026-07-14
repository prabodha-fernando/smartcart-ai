import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { FavoriteItem, LimitedProduct } from "@/types/product";
import { hasBackendSession } from "@/store/authStore";
import {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
  type ServerWishlist,
} from "@/services/api";

/**
 * Favorites map to the server-side wishlist when signed in, with localStorage
 * as the guest fallback. Like the cart, mutations update locally first, then
 * reconcile against the API. The backend doesn't store `addedAt`, so we
 * synthesize a descending timestamp on hydrate to keep the recency sort stable.
 */

function isAuthed(): boolean {
  return hasBackendSession();
}

/** Maps the backend wishlist (keyed by `productId`) to the store's shape. */
function mapServerWishlist(wishlist: ServerWishlist): FavoriteItem[] {
  const base = Date.now();
  return wishlist.items.map((i, index) => ({
    id: i.productId,
    title: i.title,
    price: i.price,
    rating: i.rating,
    thumbnail: i.thumbnail,
    note: i.note || undefined,
    addedAt: base - index,
  }));
}

interface FavoritesState {
  favorites: FavoriteItem[];
  hasHydrated: boolean;
  syncing: boolean;

  addFavorite: (product: LimitedProduct) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (product: LimitedProduct) => void;
  updateNote: (id: number, note: string) => void;
  clearFavorites: () => void;
  isFavorite: (id: number) => boolean;

  syncFromServer: () => Promise<void>;
  mergeLocalIntoServer: () => Promise<void>;
  resetLocal: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => {
      const applyServer = (wishlist: ServerWishlist) =>
        set({ favorites: mapServerWishlist(wishlist) });
      const resync = () => {
        void get().syncFromServer();
      };

      return {
        favorites: [],
        hasHydrated: false,
        syncing: false,

        // CREATE
        addFavorite: (product) => {
          const exists = get().favorites.some((item) => item.id === product.id);
          if (exists) return;

          set((state) => ({
            favorites: [
              ...state.favorites,
              { ...product, addedAt: Date.now() },
            ],
          }));

          if (isAuthed()) {
            addWishlistItem(product.id).then(applyServer).catch(resync);
          }
        },

        // DELETE (single)
        removeFavorite: (id) => {
          set((state) => ({
            favorites: state.favorites.filter((item) => item.id !== id),
          }));

          if (isAuthed()) {
            removeWishlistItem(id).then(applyServer).catch(resync);
          }
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

          if (isAuthed()) {
            addWishlistItem(id, trimmed).then(applyServer).catch(resync);
          }
        },

        // DELETE (all)
        clearFavorites: () => {
          const ids = get().favorites.map((item) => item.id);
          set({ favorites: [] });

          if (isAuthed() && ids.length > 0) {
            Promise.all(ids.map((id) => removeWishlistItem(id))).catch(resync);
          }
        },

        // READ helper
        isFavorite: (id) => get().favorites.some((item) => item.id === id),

        syncFromServer: async () => {
          if (!isAuthed()) return;
          set({ syncing: true });
          try {
            const wishlist = await getWishlist();
            set({ favorites: mapServerWishlist(wishlist) });
          } catch {
            // Keep the last-known local state on transient failures.
          } finally {
            set({ syncing: false });
          }
        },

        mergeLocalIntoServer: async () => {
          if (!isAuthed()) return;
          const local = get().favorites;
          set({ syncing: true });
          try {
            for (const item of local) {
              await addWishlistItem(item.id, item.note);
            }
            const wishlist = await getWishlist();
            set({ favorites: mapServerWishlist(wishlist) });
          } catch {
            toast.error("Couldn't sync your favorites.");
            await get().syncFromServer();
          } finally {
            set({ syncing: false });
          }
        },

        resetLocal: () => set({ favorites: [] }),

        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      };
    },
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
