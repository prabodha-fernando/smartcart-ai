"use client";

import { useState } from "react";
import Link from "next/link";
import StaticPageShell from "@/components/layout/StaticPageShell";
import { ChevronDown, MessageCircle } from "lucide-react";

const faqs = [
  {
    q: "How does the AI shopping assistant work?",
    a: "Type what you're looking for in plain language. The assistant converts your request into a structured query, fetches matching products in real time, and shows the actual results — never just text.",
  },
  {
    q: "How do I save products?",
    a: "Tap the heart icon on any product card or the 'Add to Favorites' button on a product page. Your favorites are saved to your device and appear on the Favorites page.",
  },
  {
    q: "How does the cart work?",
    a: "Use 'Add to Cart' on any product. Open the cart from the navbar to change quantities, remove items, or check out. Your cart persists between visits.",
  },
  {
    q: "Do I need an account?",
    a: "Yes — sign in from the login page. You can use the demo credentials or create a local account to explore the app.",
  },
  {
    q: "How do I search and filter products?",
    a: "Use the search bar in the navbar, or open the Products page to filter by category and sort by price or rating.",
  },
  {
    q: "Is my data secure?",
    a: "We only store what's needed to run the app. See our Privacy Policy for details on what we collect and how it's used.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <StaticPageShell
      eyebrow="Help center"
      title="How can we help?"
      description="Answers to the most common questions about shopping, favorites, and the AI assistant."
    >
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-medium text-slate-950">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-slate-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <p className="px-6 pb-6 text-sm leading-7 text-slate-600">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-12 max-w-3xl rounded-[1.5rem] bg-[#eef3ff] p-8 text-center">
        <span className="brand-gradient mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">
          <MessageCircle size={22} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-slate-950">
          Still need help?
        </h2>
        <p className="mt-2 text-slate-600">
          Our team is happy to answer anything we haven&apos;t covered.
        </p>
        <Link
          href="/contact"
          className="primary-pill mt-6 inline-flex px-7 py-3 text-sm font-semibold"
        >
          Contact Support
        </Link>
      </div>
    </StaticPageShell>
  );
}
