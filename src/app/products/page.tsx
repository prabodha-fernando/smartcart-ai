"use client";

import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
import FloatingAIAssistant from "@/components/ai/FloatingAIAssistant";
import {
  useSearchProducts,
  useCategories,
  useProductsByCategory,
  useInfiniteLimitedProducts,
} from "@/hooks/useProducts";
import { Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LimitedProduct } from "@/types/product";
import { useSearchParams } from "next/navigation";
import { Reveal } from "@/components/ui/motion";
import { motion } from "framer-motion";

type SortOption = "featured" | "price" | "rating";

const SORT_OPTIONS: [SortOption, string][] = [
  ["featured", "Featured"],
  ["price", "Price"],
  ["rating", "Rating"],
];

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  return <ProductsState key={searchQuery} initialSearch={searchQuery} />;
}

function ProductsState({ initialSearch }: { initialSearch: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryVisibleCount, setCategoryVisibleCount] = useState(8);
  const debouncedSearch = useDebouncedValue(search);

  const {
    data: limitedProducts,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLimitedProducts(8);
  const { data: categories } = useCategories();
  const { data: categoryProducts } = useProductsByCategory(selectedCategory);
  const { data: searchResults } = useSearchProducts(debouncedSearch);

  const loadedProducts =
    limitedProducts?.pages.flatMap((page) => page.products) ?? [];

  const products =
    debouncedSearch.length > 0
      ? searchResults?.products
      : selectedCategory
      ? categoryProducts?.products
      : loadedProducts;

  const sortedProducts = sortProducts(products || [], sortBy);
  const isCategoryView = !debouncedSearch && selectedCategory.length > 0;
  const visibleProducts = isCategoryView
    ? sortedProducts.slice(0, categoryVisibleCount)
    : sortedProducts;
  const showLoadMore =
    !debouncedSearch && !selectedCategory && hasNextPage;
  const showCategoryLoadMore =
    isCategoryView && categoryVisibleCount < sortedProducts.length;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-16 md:py-20">
          <div className="flex flex-col gap-8">
            <Reveal>
              <div className="rounded-[2rem] border border-slate-200/60 bg-gradient-to-br from-white via-blue-50/70 to-teal-50/60 px-7 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.1)] backdrop-blur-xl md:px-10">
                <p className="label-caps text-blue-700">Curated catalog</p>
                <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-slate-950 md:text-6xl">
                  Explore Products
                </h1>
                <p className="mt-4 max-w-2xl text-xl text-slate-500">
                  AI-curated selections tailored to your preferences, budgets,
                  and shopping intent.
                </p>
              </div>
            </Reveal>

          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_1fr]">
            <aside className="h-fit rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] lg:sticky lg:top-28">
              <p className="label-caps px-2 pb-3 text-slate-500">
                Filter by category
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setCategoryVisibleCount(8);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    selectedCategory === ""
                      ? "bg-blue-700 text-white shadow-[0_12px_28px_rgba(0,74,198,0.2)]"
                      : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <span>All Products</span>
                  <span className="text-xs opacity-60">→</span>
                </button>

                <CategoryFilter
                  categories={categories || []}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(category) => {
                    setSelectedCategory(category);
                    setCategoryVisibleCount(8);
                  }}
                />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="label-caps px-2 pb-3 text-slate-500">Sort by</p>
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((open) => !open)}
                    className="inline-flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <span>{SORT_OPTIONS.find(([value]) => value === sortBy)?.[1]}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${
                        sortOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {sortOpen && (
                    <button
                      type="button"
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setSortOpen(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                  )}

                  {sortOpen && (
                    <ul
                      role="listbox"
                      className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 text-sm shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
                    >
                      {SORT_OPTIONS.map(([value, label]) => (
                        <li key={value}>
                          <button
                            role="option"
                            aria-selected={sortBy === value}
                            onClick={() => {
                              setSortBy(value);
                              setSortOpen(false);
                            }}
                            className={`flex w-full items-center px-5 py-2.5 text-left font-medium ${
                              sortBy === value
                                ? "bg-blue-700 text-white"
                                : "text-slate-950 hover:bg-slate-50"
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCategoryVisibleCount(8);
                  }}
                  className="w-full bg-transparent font-mono text-sm outline-none"
                />
              </div>
            </aside>

            <div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && <ErrorMessage message="Failed to load products." />}

          {!isLoading && !isError && visibleProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try changing your search keyword or category filter."
            />
          )}

          {!isLoading && !isError && visibleProducts.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && (showLoadMore || showCategoryLoadMore) && (
            <div className="mt-24 flex items-center justify-center">
              <motion.button
                disabled={showLoadMore && isFetchingNextPage}
                onClick={() => {
                  if (showCategoryLoadMore) {
                    setCategoryVisibleCount((count) => count + 8);
                    return;
                  }
                  fetchNextPage();
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-700 px-8 text-base font-semibold text-white disabled:opacity-40"
              >
                {showLoadMore && isFetchingNextPage ? "Loading..." : "Load More"}
              </motion.button>
            </div>
          )}
            </div>
          </div>
        </section>

        <Footer />
        <FloatingAIAssistant />
      </main>
    </ProtectedRoute>
  );
}

function sortProducts<T extends LimitedProduct>(
  products: T[],
  sortBy: "featured" | "price" | "rating"
) {
  if (sortBy === "price") {
    return [...products].sort((a, b) => a.price - b.price);
  }

  if (sortBy === "rating") {
    return [...products].sort((a, b) => b.rating - a.rating);
  }

  return products;
}

function ProductsLoading() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />
        <section className="app-container py-16">
          <ProductSkeleton />
        </section>
      </main>
    </ProtectedRoute>
  );
}
