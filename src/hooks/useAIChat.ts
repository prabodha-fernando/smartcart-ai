"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AIChatMessage,
  AIChatMeta,
  LimitedProduct,
} from "@/types/product";

// Drives the streaming shopping conversation against /api/ai/chat.
// Reads the metadata frame (products) first, then appends prose tokens to the
// in-flight assistant message as they arrive.
export function useAIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Products currently on screen, sent back so the model can answer follow-ups
  // without re-searching the catalog.
  const lastProductsRef = useRef<LimitedProduct[]>([]);

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

        if (!response.ok || !response.body) {
          throw new Error("Request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let metaParsed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          if (!metaParsed) {
            const newline = buffer.indexOf("\n");
            if (newline === -1) continue;

            const metaLine = buffer.slice(0, newline);
            buffer = buffer.slice(newline + 1);
            metaParsed = true;

            try {
              const meta = JSON.parse(metaLine) as AIChatMeta;
              if (Array.isArray(meta.products) && meta.products.length > 0) {
                lastProductsRef.current = meta.products;
              }
              // Only attach the grid to this turn when it's a fresh search,
              // so follow-up answers don't duplicate the cards above.
              if (meta.isNewSearch) {
                patchLast((m) => ({ ...m, products: meta.products }));
              }
            } catch {
              // ignore a malformed metadata frame
            }
          }

          if (metaParsed && buffer) {
            const chunk = buffer;
            buffer = "";
            patchLast((m) => ({ ...m, content: m.content + chunk }));
          }
        }
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
