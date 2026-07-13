import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { LimitedProduct } from "@/types/product";
import { hasBackendSession } from "@/store/authStore";
import {
  addCartItem,
  clearServerCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type ServerCart,
} from "@/services/api";

export interface CartItem extends LimitedProduct {
  quantity: number;
}

/**
 * The cart is server-authoritative when the user is signed in, and falls back
 * to localStorage for guests. Mutations stay synchronous (optimistic local
 * update) so the UI feels instant; when authed they also fire the matching API
 * call and reconcile against the server's response. A failed call re-syncs from
 * the server so local state can't drift.
 */

function isAuthed(): boolean {
  return hasBackendSession();
}

/** Maps the backend cart (keyed by `productId`) to the store's `id`-keyed shape. */
function mapServerCart(cart: ServerCart): CartItem[] {
  return cart.items.map((i) => ({
    id: i.productId,
    title: i.title,
    price: i.price,
    rating: i.rating ?? 0,
    thumbnail: i.thumbnail,
    quantity: i.quantity,
  }));
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  syncing: boolean;

  addItem: (product: LimitedProduct, quantity?: number) => void;
  removeItem: (id: number) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  count: () => number;
  subtotal: () => number;

  /** Replace local state with the server's cart (used on refresh/login). */
  syncFromServer: () => Promise<void>;
  /** Push the guest cart to the server on login, then adopt the merged result. */
  mergeLocalIntoServer: () => Promise<void>;
  /** Clear the local mirror without touching the server (used on logout). */
  resetLocal: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      const applyServer = (cart: ServerCart) => set({ items: mapServerCart(cart) });
      const resync = () => {
        void get().syncFromServer();
      };

      return {
        items: [],
        hasHydrated: false,
        syncing: false,

        addItem: (product, quantity = 1) => {
          set((state) => {
            const existing = state.items.find((item) => item.id === product.id);

            if (existing) {
              return {
                items: state.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }

            return { items: [...state.items, { ...product, quantity }] };
          });

          if (isAuthed()) {
            addCartItem(product.id, quantity).then(applyServer).catch(resync);
          }
        },

        removeItem: (id) => {
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));

          if (isAuthed()) {
            removeCartItem(id).then(applyServer).catch(resync);
          }
        },

        increment: (id) => {
          const current = get().items.find((item) => item.id === id);
          if (!current) return;
          const next = current.quantity + 1;

          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity: next } : item
            ),
          }));

          if (isAuthed()) {
            updateCartItem(id, next).then(applyServer).catch(resync);
          }
        },

        decrement: (id) => {
          const current = get().items.find((item) => item.id === id);
          if (!current) return;
          const next = current.quantity - 1;

          set((state) => ({
            items: state.items
              .map((item) =>
                item.id === id ? { ...item, quantity: next } : item
              )
              .filter((item) => item.quantity > 0),
          }));

          if (isAuthed()) {
            const req = next > 0 ? updateCartItem(id, next) : removeCartItem(id);
            req.then(applyServer).catch(resync);
          }
        },

        setQuantity: (id, quantity) => {
          const safeQuantity = Math.max(0, Math.floor(quantity));

          set((state) => ({
            items: state.items
              .map((item) =>
                item.id === id ? { ...item, quantity: safeQuantity } : item
              )
              .filter((item) => item.quantity > 0),
          }));

          if (isAuthed()) {
            const req =
              safeQuantity > 0
                ? updateCartItem(id, safeQuantity)
                : removeCartItem(id);
            req.then(applyServer).catch(resync);
          }
        },

        clearCart: () => {
          set({ items: [] });

          if (isAuthed()) {
            clearServerCart().then(applyServer).catch(resync);
          }
        },

        count: () =>
          get().items.reduce((total, item) => total + item.quantity, 0),

        subtotal: () =>
          get().items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          ),

        syncFromServer: async () => {
          if (!isAuthed()) return;
          set({ syncing: true });
          try {
            const cart = await getCart();
            set({ items: mapServerCart(cart) });
          } catch {
            // Keep the last-known local state on transient failures.
          } finally {
            set({ syncing: false });
          }
        },

        mergeLocalIntoServer: async () => {
          if (!isAuthed()) return;
          const local = get().items;
          set({ syncing: true });
          try {
            for (const item of local) {
              await addCartItem(item.id, item.quantity);
            }
            const cart = await getCart();
            set({ items: mapServerCart(cart) });
          } catch {
            toast.error("Couldn't sync your cart.");
            await get().syncFromServer();
          } finally {
            set({ syncing: false });
          }
        },

        resetLocal: () => set({ items: [] }),

        setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      };
    },
    {
      name: "smartcart-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
