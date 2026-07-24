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
  const [sort, setSort] = useState<string>("");

  const {
    data: categoryProducts,
    isLoading,
    isError,
  } = useProductsByCategory(category, sort || undefined);
  const { data: categories } = useCategories();

  const categoryName =
    categories?.find((item) => item.slug === category)?.name ??
    category.replace(/-/g, " ");

  const products = categoryProducts?.data ?? [];
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

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-950">
              Explore Products
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
              >
                <option value="">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

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
