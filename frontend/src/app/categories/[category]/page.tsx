"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FloatingAIAssistant from "@/components/ai/FloatingAIAssistant";
import ProductCard from "@/components/products/ProductCard";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { useCategories, useProductsByCategory } from "@/hooks/useProducts";
import { Reveal } from "@/components/ui/motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function CategoryProductsPage() {
  const params = useParams();
  const category = params.category as string;

  return <CategoryProductsState key={category} category={category} />;
}

function CategoryProductsState({ category }: { category: string }) {
  const [visibleCount, setVisibleCount] = useState(8);

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
  const visibleProducts = products.slice(0, visibleCount);
  const showLoadMore = visibleCount < products.length;

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
            <div className="rounded-[2rem] border border-slate-200/60 bg-gradient-to-br from-white via-blue-50/70 to-teal-50/60 px-7 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl md:px-10">
              <p className="label-caps text-blue-700">Category</p>
              <h1 className="mt-3 font-display text-4xl font-bold capitalize text-slate-950 md:text-5xl">
                {categoryName}
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-slate-500">
                {!isLoading && !isError
                  ? `${products.length} products in this category.`
                  : "AI-curated selections tailored to your preferences."}
              </p>
            </div>
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
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && showLoadMore && (
            <div className="mt-24 flex items-center justify-center">
              <motion.button
                onClick={() => setVisibleCount((count) => count + 8)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-700 px-8 text-base font-semibold text-white"
              >
                Load More
              </motion.button>
            </div>
          )}
        </section>

        <Footer />
        <FloatingAIAssistant />
      </main>
    </ProtectedRoute>
  );
}
