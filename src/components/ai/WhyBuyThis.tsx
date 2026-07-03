"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types/product";

export default function WhyBuyThis({ product }: { product: Product }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Guards against a stale stream overwriting a newer one (e.g. on regenerate).
  const requestId = useRef(0);

  // Runs the request. State is only updated after the first `await`, so it's
  // safe to call from an effect without triggering cascading renders.
  const generate = useCallback(async () => {
    const id = ++requestId.current;

    try {
      const response = await fetch("/api/ai/why-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            title: product.title,
            price: product.price,
            rating: product.rating,
            description: product.description,
            category: product.category,
            brand: product.brand,
            stock: product.stock,
            discountPercentage: product.discountPercentage,
            tags: product.tags,
            warrantyInformation: product.warrantyInformation,
            shippingInformation: product.shippingInformation,
            availabilityStatus: product.availabilityStatus,
          },
        }),
      });

      if (id !== requestId.current) return; // superseded while awaiting

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      setFailed(false);
      setText("");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (id !== requestId.current) return; // superseded by a newer request
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    // generate() only calls setState after `await fetch`, never synchronously,
    // so this doesn't cause the cascading renders the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  // Event handler — safe to reset state synchronously here.
  const handleRegenerate = () => {
    setLoading(true);
    setFailed(false);
    setText("");
    generate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-[#eef3ff] to-white p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white">
            <Sparkles size={16} />
          </span>
          <h2 className="font-display text-xl font-semibold text-slate-950">
            Why you&apos;ll love this
          </h2>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
        >
          <RotateCcw size={13} />
          Regenerate
        </button>
      </div>

      <div className="mt-5 min-h-[3rem] text-lg leading-8 text-slate-700">
        {loading && text.length === 0 ? (
          <TypingDots />
        ) : failed ? (
          <span className="text-slate-500">
            Couldn&apos;t generate a summary right now. Try regenerating.
          </span>
        ) : (
          <p className="whitespace-pre-wrap">
            {text}
            {loading && (
              <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-teal-600 align-middle" />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
