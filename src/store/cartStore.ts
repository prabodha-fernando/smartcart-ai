import { create } from "zustand";
import { LimitedProduct } from "@/types/product";

interface CartState {
  items: LimitedProduct[];
  addItem: (product: LimitedProduct) => void;
  removeItem: (id: number) => void;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const exists = get().items.some((item) => item.id === product.id);

    if (!exists) {
      set((state) => ({ items: [...state.items, product] }));
    }
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  count: () => get().items.length,
}));
