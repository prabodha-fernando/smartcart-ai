"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { useAIProductAssistant } from "@/hooks/useAI";

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const aiMutation = useAIProductAssistant();

  const handleAsk = async () => {
    await aiMutation.mutateAsync(question);
  };

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] md:p-8">
      <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full bg-teal-700 px-4 py-1.5 text-white label-caps">
        <Sparkles size={14} />
        AI Assistant
      </div>

      <h2 className="text-center font-display text-2xl font-semibold text-slate-950 md:text-3xl">
        What&apos;s on your mind?
      </h2>

      <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 rounded-3xl border border-slate-300 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should I buy for university?"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 font-mono text-sm outline-none sm:px-5 sm:py-0"
        />

        <button
          onClick={handleAsk}
          disabled={aiMutation.isPending}
          className="primary-pill inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold"
        >
          {aiMutation.isPending ? "Thinking..." : "Ask AI"}
          <Send size={16} />
        </button>
      </div>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span>Try:</span>
        {[
          "Best noise-canceling headphones",
          "Durable laptop bags under $100",
          "Top-rated mechanical keyboards",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => setQuestion(prompt)}
            className="rounded-full bg-[#eef3ff] px-3 py-1"
          >
            {prompt}
          </button>
        ))}
      </div>

      {aiMutation.data && (
        <div className="mx-auto mt-6 max-w-5xl">
          <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
            Structured query: category{" "}
            <strong>{aiMutation.data.query.category || "any"}</strong>, max
            price{" "}
            <strong>{aiMutation.data.query.maxPrice || "any"}</strong>, keywords{" "}
            <strong>{aiMutation.data.query.keywords.join(", ") || "none"}</strong>
          </div>

          {aiMutation.data.products.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {aiMutation.data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-600">
              No matching products found. Try a broader prompt.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
