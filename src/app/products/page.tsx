"use client";

import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
import AIAssistant from "@/components/ai/AIAssistant";
import {
  useSearchProducts,
  useCategories,
  useProductsByCategory,
  useInfiniteLimitedProducts,
} from "@/hooks/useProducts";
import { Suspense, useState } from "react";
import { Bot, ChevronDown } from "lucide-react";
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
  const showLoadMore =
    !debouncedSearch && !selectedCategory && hasNextPage;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-16 md:py-20">
          <div className="flex flex-col gap-8">
            <Reveal>
              <h1 className="font-display text-5xl font-bold leading-tight text-slate-950 md:text-6xl">
                Explore Products
              </h1>
              <p className="mt-4 text-xl text-slate-500">
                AI-curated selections tailored to your preferences.
              </p>
            </Reveal>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-full px-6 py-3 text-base font-medium ${
                    selectedCategory === ""
                      ? "bg-blue-700 text-white"
                      : "bg-slate-50 text-slate-950"
                  }`}
                >
                  All Products
                </button>

                <CategoryFilter
                  categories={
                    categories?.filter((category) =>
                      [
                        "laptops",
                        "smartphones",
                        "mobile-accessories",
                      ].includes(category.slug)
                    ) || []
                  }
                  selectedCategory={selectedCategory}
                  onSelectCategory={(category) =>
                    setSelectedCategory(category)
                  }
                />
              </div>

              <div className="relative flex items-center gap-4 text-lg text-slate-500">
                Sort by:
                <button
                  onClick={() => setSortOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-6 py-3 font-medium text-slate-950"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  <span className="capitalize">{sortBy}</span>
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
                    className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 text-base shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
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

            <div className="max-w-xl rounded-[20px] bg-slate-50 px-5 py-3 lg:hidden">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent font-mono outline-none"
              />
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

          {!isLoading && !isError && sortedProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try changing your search keyword or category filter."
            />
          )}

          {!isLoading && !isError && sortedProducts.length > 0 && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {sortedProducts.map((product, index) => (
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
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-700 px-8 text-base font-semibold text-white disabled:opacity-40"
              >
                {showLoadMore && isFetchingNextPage ? "Loading..." : "Load More"}
              </motion.button>
            </div>
          )}
        </section>

        <section id="products-ai" className="app-container pb-10">
          <AIAssistant />
        </section>

        <button
          onClick={() =>
            document
              .getElementById("products-ai")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_16px_40px_rgba(0,74,198,0.35)] motion-safe:transition motion-safe:hover:scale-105 md:bottom-10 md:right-10 md:h-16 md:w-16"
          aria-label="Open AI assistant"
        >
          <Bot size={26} />
        </button>

        <Footer />
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
