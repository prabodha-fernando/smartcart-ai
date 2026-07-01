"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import { useFavoritesStore } from "@/store/favoritesStore";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { Heart, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useRemoveFavorite } from "@/hooks/useFavorites";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const removeFavorite = useRemoveFavorite();
  const addItem = useCartStore((state) => state.addItem);
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
            <div>
              <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
                Saved Products
              </h1>
              <p className="mt-4 text-xl text-slate-500">
                Manage your curated collection of AI-recommended products.
              </p>
            </div>
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
              {sortedFavorites.map((product) => (
                <article
                  key={product.id}
                  className="premium-card relative p-7 transition hover:-translate-y-1"
                >
                  <button
                    onClick={() => removeFavorite.mutate(product.id)}
                    className="absolute right-5 top-5 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-700 shadow"
                    aria-label={`Remove ${product.title}`}
                  >
                    <Heart fill="currentColor" size={24} />
                  </button>

                  <div className="relative h-64 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain"
                    />
                  </div>

                  <p className="mt-7 label-caps text-slate-500">
                    {product.category || "AI Pick"}
                  </p>
                  <h2 className="mt-3 line-clamp-2 font-display text-2xl font-semibold text-slate-950">
                    {product.title}
                  </h2>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="font-display text-3xl font-bold text-blue-700">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        addItem(product);
                        toast.success(`${product.title} added to cart`);
                      }}
                      className="primary-pill inline-flex items-center gap-2 px-5 py-3 font-semibold"
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
