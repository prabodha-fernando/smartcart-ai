"use client";

import StaticPageShell from "@/components/layout/StaticPageShell";
import { StaggerGroup, MotionItem } from "@/components/ui/motion";
import { Sparkles, Target, Users, Zap } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Intent-first",
    description:
      "We start from what you actually need and let AI surface the products that fit — not the ones with the biggest ad budget.",
  },
  {
    icon: Zap,
    title: "Effortless",
    description:
      "Fast search, smart filtering, and instant recommendations remove the friction from finding the right thing.",
  },
  {
    icon: Users,
    title: "People-centered",
    description:
      "Every feature is designed around real shopping behavior, from favorites to personalized picks.",
  },
];

const stats = [
  ["10k+", "Products indexed"],
  ["24", "Categories"],
  ["99.9%", "Uptime"],
  ["4.8/5", "Avg. rating"],
];

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="Our story"
      title="About SmartCart AI"
      description="SmartCart AI is a modern shopping experience that pairs a clean, fast storefront with an AI assistant that understands natural language and returns real products."
    >
      <div className="grid gap-6 rounded-[1.5rem] bg-[#eef3ff] p-8 md:grid-cols-4 md:p-10">
        {stats.map(([value, label]) => (
          <div key={label} className="text-center md:text-left">
            <p className="font-display text-4xl font-bold text-slate-950">
              {value}
            </p>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <div className="flex items-center gap-2 text-blue-700">
          <Sparkles size={18} />
          <span className="label-caps">What we value</span>
        </div>
        <StaggerGroup className="mt-6 grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <MotionItem
              key={title}
              className="premium-card p-8"
              whileHover={{ y: -6 }}
            >
              <span className="brand-gradient inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-slate-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </MotionItem>
          ))}
        </StaggerGroup>
      </div>

      <div className="mt-14 grid gap-8 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-8 md:grid-cols-2 md:p-12">
        <h2 className="font-display text-2xl font-semibold text-slate-950">
          Built for the way people really shop.
        </h2>
        <div className="space-y-4 text-slate-600">
          <p className="leading-7">
            We started SmartCart AI with a simple belief: finding the right
            product should feel like asking a knowledgeable friend, not scrolling
            endless listings.
          </p>
          <p className="leading-7">
            Our assistant turns a plain-language request into a structured query,
            fetches matching products in real time, and shows you the results —
            no guesswork, no noise.
          </p>
        </div>
      </div>
    </StaticPageShell>
  );
}
