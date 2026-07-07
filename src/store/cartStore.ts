import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LimitedProduct } from "@/types/product";

export interface CartItem extends LimitedProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;

  addItem: (product: LimitedProduct, quantity?: number) => void;
  removeItem: (id: number) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  count: () => number;
  subtotal: () => number;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

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
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      increment: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        }));
      },

      decrement: (id) => {
        set((state) => ({
          // Drop the item when its quantity would reach zero.
          items: state.items
            .map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            )
            .filter((item) => item.quantity > 0),
        }));
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
      },

      clearCart: () => set({ items: [] }),

      count: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
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
