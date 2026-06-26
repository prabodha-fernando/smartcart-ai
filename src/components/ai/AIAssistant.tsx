"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { generateAIRecommendation } from "@/lib/aiAssistant";

interface AIAssistantProps {
  products: Product[];
}

export default function AIAssistant({ products }: AIAssistantProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = () => {
    const response = generateAIRecommendation(question, products);
    setAnswer(response);
  };

  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        AI Shopping Assistant
      </h2>

      <p className="mt-2 text-gray-500">
        Ask for product recommendations based on price, rating, or purpose.
      </p>

      <div className="mt-6 flex gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI: What is the best budget product?"
          className="w-full rounded-xl border px-4 py-3"
        />

        <button
          onClick={handleAsk}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
        >
          Ask
        </button>
      </div>

      {answer && (
        <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-blue-700">
          {answer}
        </div>
      )}
    </div>
  );
}