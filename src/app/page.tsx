"use client";

import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Product } from "@/types/product";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import AIAssistant from "@/components/ai/AIAssistant";

export default function HomePage() {
  const { data, isLoading, isError } = useProducts();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h1 className="text-4xl font-bold text-gray-900">
              Find Better Products with AI
            </h1>

            <p className="mt-3 max-w-2xl text-gray-500">
              Discover smart shopping recommendations, compare products, and
              browse trending items.
            </p>
          </div>

          {!isLoading && !isError && data?.products && (
            <div className="mt-6">
              <AIAssistant products={data.products} />
            </div>
          )}

          <h2 className="mt-10 text-2xl font-bold text-gray-900">
            Trending Products
          </h2>

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
              {data?.products?.slice(0, 8).map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}