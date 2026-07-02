"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "@/components/products/ProductCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/motion";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const [sortBy, setSortBy] = useState<"recent" | "price">("recent");
  const sortedFavorites = useMemo(() => {
    if (sortBy === "price") {
      return [...favorites].sort((a, b) => a.price - b.price);
    }

    return favorites;
  }, [favorites, sortBy]);

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
                Manage your curated collection of AI-recommended products.
              </p>
            </Reveal>
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
          </div>

          {favorites.length === 0 ? (
            <EmptyState
              title="No favorites yet"
              description="Browse products and add items to your favorites list."
            />
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {sortedFavorites.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
