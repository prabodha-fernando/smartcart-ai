"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductCard from "@/components/products/ProductCard";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { useCategories, useProductsByCategory } from "@/hooks/useProducts";
import { Reveal } from "@/components/ui/motion";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CategoryProductsPage() {
  const params = useParams();
  const category = params.category as string;

  const {
    data: categoryProducts,
    isLoading,
    isError,
  } = useProductsByCategory(category);
  const { data: categories } = useCategories();

  const categoryName =
    categories?.find((item) => item.slug === category)?.name ??
    category.replace(/-/g, " ");

  const products = categoryProducts?.products ?? [];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-10 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>
          <span className="mx-3">›</span>
          <Link href="/categories" className="hover:text-slate-950">
            Categories
          </Link>
          <span className="mx-3">›</span>
          <span className="capitalize text-slate-950">{categoryName}</span>
        </section>

        <section className="app-container pb-16">
          <Reveal>
            <h1 className="font-display text-4xl font-bold capitalize text-slate-950 md:text-5xl">
              {categoryName}
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              {!isLoading && !isError
                ? `${products.length} products in this category.`
                : "AI-curated selections tailored to your preferences."}
            </p>
          </Reveal>

          {isLoading && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && <ErrorMessage message="Failed to load products." />}

          {!isLoading && !isError && products.length === 0 && (
            <EmptyState
              title="No products found"
              description="There are no products in this category yet."
            />
          )}

          {!isLoading && !isError && products.length > 0 && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
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
