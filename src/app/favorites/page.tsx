"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "@/components/products/ProductCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/motion";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
  const hasHydrated = useFavoritesStore((state) => state.hasHydrated);

  const [sortBy, setSortBy] = useState<"recent" | "price">("recent");

  const sortedFavorites = useMemo(() => {
    if (sortBy === "price") {
      return [...favorites].sort((a, b) => a.price - b.price);
    }

    return favorites;
  }, [favorites, sortBy]);

  const handleClearAll = () => {
    if (favorites.length === 0) return;
    clearFavorites();
    toast.success("Cleared all favorites");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container min-h-[calc(100vh-260px)] py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
                Saved Products
              </h1>
              <p className="mt-4 text-xl text-slate-500">
                {hasHydrated && favorites.length > 0
                  ? `${favorites.length} item${
                      favorites.length === 1 ? "" : "s"
                    } in your curated collection.`
                  : "Manage your curated collection of AI-recommended products."}
              </p>
            </Reveal>

            {hasHydrated && favorites.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    setSortBy((current) =>
                      current === "recent" ? "price" : "recent"
                    )
                  }
                  className="soft-pill inline-flex items-center gap-3 px-6 py-3 text-lg font-medium"
                >
                  <SlidersHorizontal size={20} />
                  {sortBy === "recent" ? "Recently Added" : "Price: Low to High"}
                </button>
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-6 py-3 text-lg font-medium text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 size={20} />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {hasHydrated && favorites.length === 0 && (
            <EmptyState
              title="No favorites yet"
              description="Browse products and tap the heart icon to save items here."
              action={
                <Link
                  href="/products"
                  className="primary-pill mt-6 inline-flex px-7 py-3 text-sm font-semibold"
                >
                  Explore Products
                </Link>
              }
            />
          )}

          {favorites.length > 0 && (
            <motion.div
              layout
              className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {sortedFavorites.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
