"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Send, Sparkles, UserCircle } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { useAIChat } from "@/hooks/useAIChat";
import type { AIChatMessage, LimitedProduct } from "@/types/product";

const SUGGESTIONS = [
  "Best noise-canceling headphones under $200",
  "A thoughtful gift for a gamer",
  "Something elegant to wear to a wedding",
  "Help me set up a cozy home office",
];

export default function AIAssistant({
  contextProduct,
}: {
  contextProduct?: LimitedProduct;
}) {
  const { messages, isStreaming, error, send, reset } = useAIChat(
    contextProduct ? [contextProduct] : undefined
  );
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasChat = messages.length > 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input;
    setInput("");
    send(value);
  };

  const ask = (value: string) => {
    setInput("");
    send(value);
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex items-center justify-end gap-4">
        {hasChat && (
          <button
            onClick={reset}
            disabled={isStreaming}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
          >
            <RotateCcw size={13} />
            New chat
          </button>
        )}
      </div>

      {!hasChat && (
        <h2 className="mt-8 text-center font-display text-3xl font-semibold text-slate-950">
          What&apos;s on your mind?
        </h2>
      )}

      {/* Conversation */}
      {hasChat && (
        <div
          ref={scrollRef}
          className="mt-6 max-h-[32rem] space-y-6 overflow-y-auto pr-1"
        >
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <ChatBubble
                key={index}
                message={message}
                streaming={
                  isStreaming &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={submit}
        className="mx-auto mt-6 flex max-w-3xl items-center rounded-full border border-slate-300 bg-white p-2 shadow-sm focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-700/15"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            hasChat
              ? "Ask a follow-up..."
              : "What should I buy for university?"
          }
          className="min-w-0 flex-1 bg-transparent px-5 font-mono text-sm outline-none"
          aria-label="Message the AI assistant"
        />

        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="primary-pill inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isStreaming ? "Thinking..." : "Ask AI"}
          <Send size={16} />
        </button>
      </form>

      {error && (
        <p className="mt-3 text-center text-sm text-rose-500">{error}</p>
      )}

      {/* Suggestions (only before the first message) */}
      {!hasChat && (
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Try:</span>
          {SUGGESTIONS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="rounded-full bg-[#eef3ff] px-3 py-1 transition hover:bg-[#e0e9ff]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatBubble({
  message,
  streaming,
}: {
  message: AIChatMessage;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  const showTyping = streaming && message.content.length === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <span
        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-slate-100 text-slate-500"
            : "bg-teal-700 text-white"
        }`}
      >
        {isUser ? <UserCircle size={20} /> : <Sparkles size={16} />}
      </span>

      <div className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-700 text-white"
              : "bg-slate-50 text-slate-700"
          }`}
        >
          {showTyping ? (
            <TypingDots />
          ) : (
            <p className="whitespace-pre-wrap">
              {message.content}
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-teal-600 align-middle" />
              )}
            </p>
          )}
        </div>

        {message.products && message.products.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
