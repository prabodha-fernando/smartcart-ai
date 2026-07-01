"use client";

import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import AIAssistant from "@/components/ai/AIAssistant";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Home,
  Shirt,
  Sparkles,
  Smartphone,
  SlidersHorizontal,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { data, isLoading, isError } = useProducts();
  const categories = [
    { label: "Electronics", icon: Smartphone, meta: "1.2k items" },
    { label: "Beauty", icon: Sparkles, meta: "840 items" },
    { label: "Fashion", icon: Shirt, meta: "2.1k items" },
    { label: "Home & Decor", icon: Home, meta: "960 items" },
    { label: "Sports", icon: Trophy, meta: "540 items" },
    { label: "Books", icon: BookOpen, meta: "3.5k items" },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container grid items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight text-slate-950 md:text-5xl">
              Find Better Products with AI
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Discover personalized recommendations and smarter shopping
              experiences tailored to your lifestyle.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="primary-pill inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold"
              >
                Explore Products
                <ArrowRight size={16} />
              </Link>
              <a
                href="#assistant"
                className="soft-pill px-7 py-3 text-sm font-semibold"
              >
                Ask AI
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#eef3ff] p-12">
            <div className="mx-auto max-w-md rounded-3xl bg-white/80 p-7 shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
              <div className="mb-5 h-5 w-44 rounded-full bg-blue-100" />
              <div className="grid grid-cols-2 gap-5 rounded-2xl bg-[#dfe7ff] p-5">
                {data?.products?.slice(0, 2).map((product) => (
                  <div key={product.id} className="rounded-xl bg-[#eef3ff] p-4">
                    <div className="relative h-32 rounded-lg bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-blue-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {!isLoading && !isError && data?.products && (
          <section id="assistant" className="app-container py-6">
            <AIAssistant />
          </section>
        )}

        <section className="app-container py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-950">
                Browse by Category
              </h2>
            </div>
            <Link href="/products" className="text-sm font-medium text-blue-700">
              View All →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {categories.map(({ label, icon: Icon, meta }) => (
              <Link
                key={label}
                href="/products"
                className="premium-card flex flex-col items-center justify-center p-6 text-center transition hover:-translate-y-1"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={22} />
                </span>
                <span className="mt-4 text-sm font-semibold text-slate-950">
                  {label}
                </span>
                <span className="text-xs text-slate-500">{meta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="app-container py-8">
          <h2 className="font-display text-2xl font-semibold text-slate-950">
            Trending Today
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Hottest picks across all categories
          </p>

          {isLoading && (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorMessage message="Failed to load trending products." />
          )}

          {!isLoading && !isError && (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data?.products?.slice(0, 4).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </section>

        <section className="app-container grid gap-8 py-12 lg:grid-cols-[2fr_1fr]">
          <div className="grid overflow-hidden rounded-[1.5rem] bg-[#dfe7ff] md:grid-cols-2">
            <div className="p-10">
              <p className="label-caps text-blue-700">Personalized Pick</p>
              <h2 className="mt-5 font-display text-3xl font-semibold text-slate-950">
                Next-Gen Workspace Bundle
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                Hand-picked by AI to enhance your productivity based on your
                recent searches.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
              >
                View Bundle
              </Link>
            </div>
            <div className="m-4 rounded-2xl bg-white/50 p-8">
              <SlidersHorizontal className="mx-auto mt-16 text-blue-700" size={92} />
            </div>
          </div>

          <div className="flex min-h-72 flex-col rounded-[1.5rem] bg-[#d3dcf6] p-8">
            <p className="label-caps text-slate-700">Flash Deal</p>
            <h3 className="mt-3 font-display text-2xl font-semibold">
              Up to 40% Off Tech
            </h3>
            <Zap className="m-auto text-blue-300" size={74} />
            <Link
              href="/products"
              className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold"
            >
              Shop Sale
            </Link>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="app-container">
            <h2 className="text-center font-display text-2xl font-semibold">
              Why Shop with SmartCart?
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                ["AI Recommendations", Sparkles],
                ["Smart Filtering", SlidersHorizontal],
                ["Personalized Feed", UserCheck],
              ].map(([title, Icon]) => (
                <div key={title as string} className="rounded-2xl bg-white p-8 shadow-sm">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold">
                    {title as string}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Intelligent shopping tools reduce noise and surface products
                    you will actually love.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
