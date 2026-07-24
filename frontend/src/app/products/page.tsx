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
import FloatingAIAssistant, { type FloatingAIAssistantHandle } from "@/components/ai/FloatingAIAssistant";
import {
  useSearchProducts,
  useCategories,
  useProductsByCategory,
  useInfiniteLimitedProducts,
} from "@/hooks/useProducts";
import { Suspense, useState, useRef } from "react";
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
  const initialCategory = searchParams.get("category") ?? undefined;

  return <ProductsState key={searchQuery} initialSearch={searchQuery} />;
}

function ProductsState({ initialSearch }: { initialSearch: string }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [sortBy, setSortBy] = useState<"featured" | "price" | "rating">(
    "featured"
  );
  
  const floatingAssistantRef = useRef<FloatingAIAssistantHandle>(null);
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
  const categoryQuery = useProductsByCategory(selectedCategory);
  const searchQuery = useSearchProducts(debouncedSearch);
  const categoryProducts = categoryQuery.data;
  const searchResults = searchQuery.data;

  const loadedProducts =
    limitedProducts?.pages.flatMap((page) => page.data) ?? [];

  const products =
    debouncedSearch.length > 0
      ? searchResults?.data
      : selectedCategory
      ? categoryProducts?.data
      : loadedProducts;

  const sortedProducts = sortProducts(products || [], sortBy);
  const showLoadMore =
    !debouncedSearch && !selectedCategory && hasNextPage;
  const activeLoading = debouncedSearch
    ? searchQuery.isLoading
    : selectedCategory
      ? categoryQuery.isLoading
      : isLoading;
  const activeError = debouncedSearch
    ? searchQuery.isError
    : selectedCategory
      ? categoryQuery.isError
      : isError;

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
                placeholder="Search products, brands, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent font-mono outline-none"
              />
            </div>
          </div>

          {activeLoading && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {activeError && <ErrorMessage message="Failed to search the product catalog." />}

          {!activeLoading && !activeError && sortedProducts.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try changing your search keyword or category filter."
            />
          )}

          {!activeLoading && !activeError && sortedProducts.length > 0 && (
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

          {!activeLoading && !activeError && showLoadMore && (
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
          <AIAssistant 
            onFirstPrompt={(prompt) =>
              floatingAssistantRef.current?.openWithPrompt(prompt)
            }
          />
        </section>

        <Footer />
        <FloatingAIAssistant ref={floatingAssistantRef} />
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
