"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useLimitedProducts } from "@/hooks/useProducts";
import Image from "next/image";
import Footer from "@/components/layout/Footer";

export default function LimitedProductsPage() {
  const { data, isLoading } =
    useLimitedProducts(10, 10);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-16">
          <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
            Limited Products
          </h1>
          <p className="mt-4 text-xl text-slate-500">
            Selected fields from the limit and skip products API.
          </p>

          {isLoading && (
            <p className="mt-6">Loading...</p>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {data?.products?.map((product) => (
              <div
                key={product.id}
                className="premium-card p-6"
              >
                <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-50">
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    sizes="(min-width: 768px) 25vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <h2 className="mt-5 font-display text-xl font-semibold">
                  {product.title}
                </h2>

                <p className="mt-4 font-display text-2xl font-bold text-blue-700">
                  ${product.price.toFixed(2)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  ⭐ {product.rating}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
