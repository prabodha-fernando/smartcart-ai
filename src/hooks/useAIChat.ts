"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AIChatMessage,
  AIChatResponse,
  LimitedProduct,
} from "@/types/product";

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
    [messages, isStreaming, patchLast]
  );

  const reset = useCallback(() => {
    setMessages([]);
    lastProductsRef.current = [];
    setError(null);
  }, []);

  return { messages, isStreaming, error, send, reset };
}
