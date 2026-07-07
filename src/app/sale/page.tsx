"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Tag,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductCard from "@/components/products/ProductCard";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import { Reveal } from "@/components/ui/motion";
import { getProductsByIds } from "@/services/api";
import { SALE_PRODUCT_IDS, SALE_PERCENT, salePrice } from "@/lib/sale";
import type { Product } from "@/types/product";

const PRICE_BANDS = [
  { value: "all", label: "Any Price" },
  { value: "under100", label: "Under $100" },
  { value: "100to1000", label: "$100 – $1000" },
  { value: "over1000", label: "Over $1000" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "saving", label: "Biggest Saving" },
];

export default function SalePage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["sale-products"],
    queryFn: () => getProductsByIds(SALE_PRODUCT_IDS),
  });

  const [category, setCategory] = useState("all");
  const [priceBand, setPriceBand] = useState("all");
  const [sort, setSort] = useState("featured");

  const categoryOptions = useMemo(() => {
    const slugs = Array.from(new Set(products.map((p) => p.category))).sort();
    return [
      { value: "all", label: "All Categories" },
      ...slugs.map((slug) => ({ value: slug, label: labelize(slug) })),
    ];
  }, [products]);

  const visible = useMemo(() => {
    const list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      const price = salePrice(p.id, p.price);
      if (priceBand === "under100") return price < 100;
      if (priceBand === "100to1000") return price >= 100 && price <= 1000;
      if (priceBand === "over1000") return price > 1000;
      return true;
    });

    const sorted = [...list];
    switch (sort) {
      case "price_asc":
        sorted.sort((a, b) => salePrice(a.id, a.price) - salePrice(b.id, b.price));
        break;
      case "price_desc":
      case "saving": // flat 40% off → biggest saving is the priciest item
        sorted.sort((a, b) => salePrice(b.id, b.price) - salePrice(a.id, a.price));
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break; // featured = original order
    }
    return sorted;
  }, [products, category, priceBand, sort]);

  const filtersActive =
    category !== "all" || priceBand !== "all" || sort !== "featured";

  const clearFilters = () => {
    setCategory("all");
    setPriceBand("all");
    setSort("featured");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />
        <SaleBanner products={products} />

        <section className="app-container py-12">
          <Reveal>
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-950">
                  On Sale Now
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {visible.length} of {products.length} deals
                </p>
              </div>

              {/* Filters + sort */}
              <div className="flex flex-wrap items-center gap-3">
                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                />
                <FilterSelect
                  label="Price"
                  value={priceBand}
                  onChange={setPriceBand}
                  options={PRICE_BANDS}
                />
                <FilterSelect
                  label="Sort"
                  value={sort}
                  onChange={setSort}
                  options={SORT_OPTIONS}
                />
                {filtersActive && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {isLoading ? (
            <div className="mt-8 flex gap-6 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[17rem] shrink-0">
                  <ProductSkeleton />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <Tag className="text-slate-300" size={40} />
              <p className="mt-4 font-display text-xl font-semibold text-slate-900">
                No deals match your filters
              </p>
              <button
                onClick={clearFilters}
                className="primary-pill mt-6 px-6 py-2.5 text-sm font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <SaleCatalog products={visible} />
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}

// Turns a category slug into a readable label ("womens-bags" -> "Womens Bags").
function labelize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-4 text-xs font-medium text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none rounded-full border border-slate-200 bg-white py-2.5 pl-[4.5rem] pr-9 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-700/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 text-slate-400"
      />
    </label>
  );
}

// --- Horizontal "On Sale Now" catalog with side arrows -------------------

function SaleCatalog({ products }: { products: Product[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  // Re-check which arrows to show when the list changes (filters/sort) or the
  // window resizes.
  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [products]);

  const scroll = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative mt-8">
      {!atStart && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product, i) => (
          <div key={product.id} className="w-[17rem] shrink-0 snap-start">
            <ProductCard
              priority={i < 4}
              product={{
                id: product.id,
                title: product.title,
                price: product.price,
                rating: product.rating,
                thumbnail: product.thumbnail,
              }}
            />
          </div>
        ))}
      </div>

      {!atEnd && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 hover:text-slate-950 sm:inline-flex"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}

// --- Rotating banner carousel --------------------------------------------

interface Slide {
  badge: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  // Index into the fetched sale products, for the slide's showcase image.
  imageIndex: number;
  glow: string;
}

const SLIDES: Slide[] = [
  {
    badge: "Flash Sale",
    icon: Zap,
    title: `${SALE_PERCENT}% OFF`,
    subtitle: "10 hand-picked products at unbeatable prices — today only.",
    imageIndex: 1, // Huawei Matebook X Pro
    glow: "bg-rose-400/30",
  },
  {
    badge: "Tech Steals",
    icon: Sparkles,
    title: "Premium Gear",
    subtitle: "Laptops, tablets & watches, all slashed by 40%.",
    imageIndex: 3, // Rolex Cellini
    glow: "bg-blue-400/30",
  },
  {
    badge: "Style Picks",
    icon: Tag,
    title: "Wear the Deal",
    subtitle: "Bags, shades and more — grab your look for less.",
    imageIndex: 8, // Heshe Women's Leather Bag
    glow: "bg-amber-400/30",
  },
];

const SLIDE_MS = 5000;
const TICK_MS = 40;

function SaleBanner({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK_MS / SLIDE_MS) * 100;
        if (next >= 100) {
          setIndex((i) => (i + 1) % SLIDES.length);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused]);

  const goTo = (i: number) => {
    setIndex(i);
    setProgress(0);
  };

  const shift = (dir: number) =>
    goTo((index + dir + SLIDES.length) % SLIDES.length);

  // Left / right arrow keys move between slides.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIndex((i) => (i + 1) % SLIDES.length);
        setProgress(0);
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
        setProgress(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const image = products[slide.imageIndex]?.thumbnail;

  return (
    <section className="app-container pt-10">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-8 py-12 text-white sm:px-14"
      >
        {/* Per-slide accent glow */}
        <AnimatePresence>
          <motion.div
            key={`glow-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl ${slide.glow}`}
          />
        </AnimatePresence>

        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          {/* Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="label-caps inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white">
                <Icon size={15} /> {slide.badge}
              </span>
              <h1 className="mt-6 font-display text-6xl font-bold leading-none md:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-5 max-w-md text-lg leading-7 text-white/80">
                {slide.subtitle}
              </p>
              <CountdownChip />
            </motion.div>
          </AnimatePresence>

          {/* Showcase image */}
          <div className="relative hidden h-56 lg:block">
            <AnimatePresence mode="wait">
              {image && (
                <motion.div
                  key={`img-${index}`}
                  initial={{ opacity: 0, scale: 0.9, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -30 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 m-auto h-52 w-52 rounded-full bg-white/10 blur-2xl" />
                  <Image
                    src={image}
                    alt={slide.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 0px"
                    className="object-contain drop-shadow-2xl"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow">
                    {SALE_PERCENT}% OFF
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Side navigation arrows */}
        <button
          onClick={() => shift(-1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => shift(1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
        >
          <ChevronRight size={20} />
        </button>

        {/* Segmented progress bar */}
        <div className="absolute inset-x-8 bottom-6 flex gap-2 sm:inset-x-14">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <span
                className="block h-full rounded-full bg-white"
                style={{
                  width:
                    i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  transition: i === index ? "none" : "width 0.3s",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// Compact "ends in" countdown shown inside the banner. Rendered after mount to
// avoid a hydration mismatch.
function CountdownChip() {
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const pad = (n: number) => n.toString().padStart(2, "0");
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor(diff / 60_000) % 60;
      const s = Math.floor(diff / 1_000) % 60;
      setLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!left) return null;

  return (
    <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-sm font-semibold tabular-nums">
      <Clock size={15} /> Ends in {left}
    </span>
  );
}
