"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useLimitedProducts } from "@/hooks/useProducts";
import Image from "next/image";

export default function LimitedProductsPage() {
  const { data, isLoading } =
    useLimitedProducts(10, 10);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold">
            Limited Products
          </h1>

          {isLoading && (
            <p className="mt-6">Loading...</p>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {data?.products?.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-white p-4 shadow"
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

                <h2 className="mt-3 font-bold">
                  {product.title}
                </h2>

                <p>${product.price}</p>

                <p>
                  ⭐ {product.rating}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
