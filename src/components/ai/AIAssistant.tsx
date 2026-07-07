"use client";

import {
  FormEvent,
  forwardRef,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  UserCircle,
} from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { isOnSale, salePrice, SALE_PERCENT } from "@/lib/sale";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import type { AIChatMessage, LimitedProduct } from "@/types/product";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Best noise-canceling headphones under $200",
  "A thoughtful gift for a gamer",
  "Something elegant to wear to a wedding",
  "Help me set up a cozy home office",
];

export interface AIAssistantHandle {
  focusComposer: () => void;
  submitPrompt: (prompt: string) => void;
}

function AIAssistant(
  {
    contextProduct,
    onFirstPrompt,
  }: {
    contextProduct?: LimitedProduct;
    onFirstPrompt?: (prompt: string) => void;
  },
  ref: Ref<AIAssistantHandle>
) {
  const { messages, isStreaming, error, send, reset } = useAIChat(
    contextProduct ? [contextProduct] : undefined
  );
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasChat = messages.length > 0;

  useImperativeHandle(ref, () => ({
    focusComposer: () => inputRef.current?.focus(),
    submitPrompt: (prompt: string) => {
      const value = prompt.trim();
      if (value) send(value);
    },
  }));

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handlePrompt = (prompt: string) => {
    const value = prompt.trim();
    if (!value) return;
    if (!hasChat && onFirstPrompt) {
      onFirstPrompt(value);
      return;
    }
    send(value);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input;
    setInput("");
    handlePrompt(value);
  };

  const ask = (value: string) => {
    setInput("");
    handlePrompt(value);
  };

  return (
    <div className="rounded-[1.25rem] border border-slate-200/60 bg-gradient-to-br from-white via-white to-blue-50/70 p-4 shadow-[0_18px_52px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-end gap-3">
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
        <div className="mt-4 text-center">
          <span className="label-caps inline-flex rounded-full border border-teal-100 bg-white/70 px-3 py-1 text-teal-700">
            Smart shopping concierge
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-slate-950">
            What&apos;s on your mind?
          </h2>
        </div>
      )}

      {/* Conversation */}
      {hasChat && (
        <div
          ref={scrollRef}
          className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto pr-1"
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
        className="mx-auto mt-4 flex max-w-2xl items-center rounded-full border border-white/80 bg-white/88 p-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-700/15"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            hasChat
              ? "Ask a follow-up..."
              : "What should I buy for university?"
          }
          className="min-w-0 flex-1 bg-transparent px-4 font-mono text-sm outline-none"
          aria-label="Message the AI assistant"
        />

        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="primary-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Try:</span>
          {SUGGESTIONS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="rounded-full border border-white/70 bg-white/75 px-3 py-1 shadow-sm transition hover:bg-[#eef3ff]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default forwardRef(AIAssistant);

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
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-slate-100 text-slate-500"
            : "bg-teal-700 text-white"
        }`}
      >
        {isUser ? <UserCircle size={18} /> : <Sparkles size={15} />}
      </span>

      <div className={`min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
          <div className="mt-3 space-y-2.5">
            {message.products.map((product, index) => (
              <AIResultProductRow
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AIResultProductRow({
  product,
  priority,
}: {
  product: LimitedProduct;
  priority: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const onSale = isOnSale(product.id);
  const displayPrice = salePrice(product.id, product.price);
  const cartItem: LimitedProduct = onSale
    ? { ...product, price: displayPrice }
    : product;
  const roundedRating = Math.round(product.rating);

  const handleAddToCart = () => {
    addItem(cartItem);
    toast.success(`${product.title} added to cart`);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(cartItem);
    toast.success(
      isFavorite
        ? "Removed from favorites"
        : `${product.title} saved to favorites`
    );
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-2.5 rounded-2xl border border-slate-200/70 bg-white/92 p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur transition hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.1)] sm:gap-3 sm:p-3"
    >
      <Link
        href={`/products/${product.id}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50 via-white to-teal-50 sm:h-20 sm:w-20"
      >
        {onSale && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-rose-500 px-1.5 py-0.5 text-[0.58rem] font-bold text-white shadow-sm sm:px-2 sm:text-[0.65rem]">
            {SALE_PERCENT}% OFF
          </span>
        )}
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="96px"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 font-display text-sm font-semibold leading-tight text-slate-950 transition hover:text-blue-700 sm:text-base"
        >
          {product.title}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">
          ${displayPrice.toFixed(2)} each
        </p>
        <div className="mt-1.5 flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={12}
              className={
                index < roundedRating ? "fill-amber-400" : "text-slate-200"
              }
            />
          ))}
          <span className="ml-1 text-xs font-medium text-slate-500">
            {product.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <p className="hidden font-display text-base font-bold text-slate-950 sm:block">
          ${displayPrice.toFixed(2)}
        </p>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={
            isFavorite
              ? `Remove ${product.title} from favorites`
              : `Save ${product.title} to favorites`
          }
          aria-pressed={isFavorite}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500"
        >
          <Heart
            size={15}
            className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
          />
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add ${product.title} to cart`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_10px_22px_rgba(0,74,198,0.2)] transition hover:bg-blue-800"
        >
          <ShoppingCart size={15} />
        </button>
      </div>
    </motion.article>
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
