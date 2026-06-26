"use client";

import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import { useFavoritesStore } from "@/store/favoritesStore";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold">My Favorites</h1>

          {favorites.length === 0 ? (
            <EmptyState
              title="No favorites yet"
              description="Browse products and add items to your favorites list."
            />
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {favorites.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}