"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AIChatMessage,
  AIChatResponse,
  FavoriteItem,
  LimitedProduct,
} from "@/types/product";
import { useCartStore, type CartItem } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";

// Drives the shopping conversation against /api/ai/chat. The backend returns a
// single structured JSON response (reply + resolved products); this hook shows
// the reply and attaches the product grid on a fresh search.
//
// `contextProducts` seeds the products the assistant already "knows about" — on
// a product detail page, that's the product being viewed, so questions like
// "is this worth it?" are answered about it.
export function useAIChat(contextProducts?: LimitedProduct[]) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const favorites = useFavoritesStore((state) => state.favorites);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const updateNote = useFavoritesStore((state) => state.updateNote);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);

  // Products currently on screen, sent back so the model can answer follow-ups
  // without re-searching the catalog.
  const lastProductsRef = useRef<LimitedProduct[]>(contextProducts ?? []);

  // Seed the viewed product as context once it loads, unless the shopper has
  // already searched (which replaces what's on screen).
  useEffect(() => {
    if (
      contextProducts &&
      contextProducts.length > 0 &&
      lastProductsRef.current.length === 0
    ) {
      lastProductsRef.current = contextProducts;
    }
  }, [contextProducts]);

  const patchLast = useCallback(
    (updater: (message: AIChatMessage) => AIChatMessage) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        next[next.length - 1] = updater(next[next.length - 1]);
        return next;
      });
    },
    []
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      const history: AIChatMessage[] = [
        ...messages,
        { role: "user", content },
      ];

      // Show the user turn plus an empty assistant turn to stream into.
      setMessages([...history, { role: "assistant", content: "" }]);

      try {
        const localAction = resolveChatCrudCommand(content, {
          lastProducts: lastProductsRef.current,
          cartItems,
          favorites,
          addItem,
          removeItem,
          setQuantity,
          clearCart,
          addFavorite,
          removeFavorite,
          updateNote,
          clearFavorites,
        });

        if (localAction) {
          if (localAction.products.length > 0) {
            lastProductsRef.current = localAction.products;
          }

          patchLast((m) => ({
            ...m,
            content: localAction.reply,
            products:
              localAction.products.length > 0 ? localAction.products : undefined,
          }));
          return;
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
            lastProducts: lastProductsRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as AIChatResponse;

        if (Array.isArray(data.products) && data.products.length > 0) {
          lastProductsRef.current = data.products;
        }

        patchLast((m) => ({
          ...m,
          content: data.reply,
          // Only attach the grid on a fresh search, so follow-up answers don't
          // duplicate the cards already on screen.
          products: data.isNewSearch ? data.products : undefined,
        }));
      } catch {
        setError("Something went wrong. Please try again.");
        patchLast((m) =>
          m.content
            ? m
            : {
                ...m,
                content:
                  "Sorry, I couldn't reach the assistant. Please try again.",
              }
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      messages,
      isStreaming,
      patchLast,
      cartItems,
      favorites,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      addFavorite,
      removeFavorite,
      updateNote,
      clearFavorites,
    ]
  );

  const reset = useCallback(() => {
    setMessages([]);
    lastProductsRef.current = [];
    setError(null);
  }, []);

  return { messages, isStreaming, error, send, reset };
}

interface ChatCrudContext {
  lastProducts: LimitedProduct[];
  cartItems: CartItem[];
  favorites: FavoriteItem[];
  addItem: (product: LimitedProduct, quantity?: number) => void;
  removeItem: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  addFavorite: (product: LimitedProduct) => void;
  removeFavorite: (id: number) => void;
  updateNote: (id: number, note: string) => void;
  clearFavorites: () => void;
}

interface ChatCrudResult {
  reply: string;
  products: LimitedProduct[];
}

function resolveChatCrudCommand(
  input: string,
  context: ChatCrudContext
): ChatCrudResult | null {
  const text = input.trim();
  const lower = normalizeText(text);
  const target = resolveCollectionTarget(lower);
  const quantity = extractQuantity(lower);

  if (target === "cart") {
    if (isReadCommand(lower)) {
      return readCart(context.cartItems);
    }

    if (isClearCommand(lower)) {
      if (context.cartItems.length === 0) {
        return { reply: "Your cart is already empty.", products: [] };
      }
      context.clearCart();
      return { reply: "Done, I cleared your cart.", products: [] };
    }

    if (isDeleteCommand(lower)) {
      const item = findProductReference(lower, context.cartItems);
      if (!item) {
        return {
          reply: "Tell me which cart item to remove, or say “clear my cart” to remove everything.",
          products: context.cartItems,
        };
      }
      context.removeItem(item.id);
      return {
        reply: `Removed ${item.title} from your cart.`,
        products: context.cartItems.filter((product) => product.id !== item.id),
      };
    }

    if (isUpdateCommand(lower)) {
      const item = findProductReference(lower, context.cartItems);
      if (!item) {
        return {
          reply: "Tell me which cart item to update and the quantity you want.",
          products: context.cartItems,
        };
      }
      if (!quantity) {
        return {
          reply: `What quantity should I set for ${item.title}?`,
          products: context.cartItems,
        };
      }
      context.setQuantity(item.id, quantity);
      return {
        reply:
          quantity > 0
            ? `Updated ${item.title} to quantity ${quantity}.`
            : `Removed ${item.title} from your cart.`,
        products: context.cartItems
          .map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, quantity } : cartItem
          )
          .filter((cartItem) => cartItem.quantity > 0),
      };
    }

    if (isCreateCommand(lower)) {
      const product = findProductReference(lower, context.lastProducts);
      if (!product) {
        return {
          reply:
            "I can add a product after I’ve shown results. Try “add the first product to cart” or mention the product name.",
          products: context.lastProducts,
        };
      }
      context.addItem(product, quantity ?? 1);
      return {
        reply: `Added ${quantity ?? 1} × ${product.title} to your cart.`,
        products: [product],
      };
    }
  }

  if (target === "favorites") {
    if (isReadCommand(lower)) {
      return readFavorites(context.favorites);
    }

    if (isClearCommand(lower)) {
      if (context.favorites.length === 0) {
        return { reply: "Your favorites list is already empty.", products: [] };
      }
      context.clearFavorites();
      return { reply: "Done, I cleared your favorites.", products: [] };
    }

    if (isDeleteCommand(lower)) {
      const item = findProductReference(lower, context.favorites);
      if (!item) {
        return {
          reply: "Tell me which favorite to remove, or say “clear favorites” to remove everything.",
          products: context.favorites,
        };
      }
      context.removeFavorite(item.id);
      return {
        reply: `Removed ${item.title} from your favorites.`,
        products: context.favorites.filter((product) => product.id !== item.id),
      };
    }

    if (isUpdateCommand(lower)) {
      const item = findProductReference(lower, context.favorites);
      const note = extractNote(text);
      if (!item || note === null) return null;
      context.updateNote(item.id, note);
      return {
        reply: note
          ? `Updated the note for ${item.title}.`
          : `Removed the note from ${item.title}.`,
        products: [item],
      };
    }

    if (isCreateCommand(lower)) {
      const product = findProductReference(lower, context.lastProducts);
      if (!product) {
        return {
          reply:
            "I can save a product after I’ve shown results. Try “save the first product” or mention the product name.",
          products: context.lastProducts,
        };
      }
      context.addFavorite(product);
      return {
        reply: `Saved ${product.title} to your favorites.`,
        products: [product],
      };
    }
  }

  return null;
}

function resolveCollectionTarget(
  lower: string
): "cart" | "favorites" | null {
  if (/\b(cart|basket)\b/.test(lower)) return "cart";
  if (/\b(favorites?|favourites?|wishlist|wish list|saved)\b/.test(lower)) {
    return "favorites";
  }
  if (/\b(save|saved)\b/.test(lower)) return "favorites";
  return null;
}

function isCreateCommand(lower: string): boolean {
  return /\b(add|put|place|save|favorite|favourite|wishlist)\b/.test(lower);
}

function isReadCommand(lower: string): boolean {
  return /\b(show|view|list|read|what|whats|display)\b/.test(lower);
}

function isUpdateCommand(lower: string): boolean {
  return /\b(update|set|change|make|quantity|qty|note)\b/.test(lower);
}

function isDeleteCommand(lower: string): boolean {
  return /\b(remove|delete|drop)\b/.test(lower);
}

function isClearCommand(lower: string): boolean {
  return /\b(clear|empty|remove all|delete all)\b/.test(lower);
}

function readCart(items: CartItem[]): ChatCrudResult {
  if (items.length === 0) return { reply: "Your cart is empty.", products: [] };

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  return {
    reply: `Your cart has ${count} item${count === 1 ? "" : "s"} with a subtotal of $${subtotal.toFixed(
      2
    )}.`,
    products: items,
  };
}

function readFavorites(items: FavoriteItem[]): ChatCrudResult {
  if (items.length === 0) {
    return { reply: "You don’t have any favorites yet.", products: [] };
  }

  return {
    reply: `You have ${items.length} favorite item${
      items.length === 1 ? "" : "s"
    }.`,
    products: items,
  };
}

function findProductReference<T extends LimitedProduct>(
  lower: string,
  products: T[]
): T | null {
  if (products.length === 0) return null;

  const index = resolveOrdinalIndex(lower, products.length);
  if (index !== null) return products[index];

  const byId = lower.match(/\b(?:id|product)\s*#?\s*(\d+)\b/);
  if (byId) {
    const id = Number(byId[1]);
    return products.find((product) => product.id === id) ?? null;
  }

  const productScores = products
    .map((product) => ({
      product,
      score: scoreProductMatch(lower, product),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return productScores[0]?.product ?? null;
}

function resolveOrdinalIndex(lower: string, length: number): number | null {
  const ordinals: Array<[RegExp, number]> = [
    [/\b(first|1st|one)\b/, 0],
    [/\b(second|2nd|two)\b/, 1],
    [/\b(third|3rd|three)\b/, 2],
    [/\b(fourth|4th|four)\b/, 3],
  ];

  const matched = ordinals.find(([pattern]) => pattern.test(lower));
  if (matched && matched[1] < length) return matched[1];
  if (/\b(last|latest|recent)\b/.test(lower)) return length - 1;
  return null;
}

function scoreProductMatch(lower: string, product: LimitedProduct): number {
  const titleWords = normalizeText(product.title)
    .split(" ")
    .filter((word) => word.length > 2);

  return titleWords.reduce(
    (score, word) => (lower.includes(word) ? score + 1 : score),
    0
  );
}

function extractQuantity(lower: string): number | null {
  const explicit = lower.match(/\b(?:qty|quantity|to|x)\s*(\d{1,2})\b/);
  const count = explicit ?? lower.match(/\b(\d{1,2})\s*(?:x|items?|pcs?|pieces?)\b/);
  if (!count) return null;

  const value = Number(count[1]);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function extractNote(text: string): string | null {
  const note = text.match(/\bnote\s*(?:to|as|:)?\s*(.+)$/i);
  if (!note) return null;
  return note[1].trim();
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
