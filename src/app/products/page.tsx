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
  useLimitedProducts,
} from "@/hooks/useProducts";
import { useState } from "react";
import { Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LimitedProduct } from "@/types/product";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price" | "rating">(
    "featured"
  );
  const [page, setPage] = useState(1);
  const limit = 10;
  const skip = (page - 1) * limit;
  const debouncedSearch = useDebouncedValue(search);

  const { data: allProducts, isLoading, isError } =
    useLimitedProducts(limit, skip);
  const { data: categories } = useCategories();
  const { data: categoryProducts } = useProductsByCategory(selectedCategory);
  const { data: searchResults } = useSearchProducts(debouncedSearch);

  const products =
    debouncedSearch.length > 0
      ? searchResults?.products
      : selectedCategory
      ? categoryProducts?.products
      : allProducts?.products;

  const sortedProducts = sortProducts(products || [], sortBy);
  const totalPages = allProducts ? Math.ceil(allProducts.total / limit) : 1;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-16">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
                Explore Products
              </h1>
              <p className="mt-4 text-xl text-slate-500">
                AI-curated selections tailored to your preferences.
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setPage(1);
                  }}
                  className={`rounded-full px-6 py-3 text-base font-medium ${
                    selectedCategory === ""
                      ? "bg-blue-700 text-white"
                      : "bg-slate-50 text-slate-950"
                  }`}
                >
                  All Products
                </button>

                <CategoryFilter
                  categories={categories?.slice(0, 4) || []}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(category) => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                />

                {[
                  ["price", "Price"],
                  ["rating", "Rating"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() =>
                      setSortBy((current) =>
                        current === value ? "featured" : (value as typeof sortBy)
                      )
                    }
                    className={`rounded-full px-6 py-3 text-base font-medium ${
                      sortBy === value
                        ? "bg-blue-700 text-white"
                        : "bg-slate-50 text-slate-950"
                    }`}
                  >
                    {label}⌄
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-base text-slate-500">
                Sort by:
                <span className="font-medium text-slate-900 capitalize">
                  {sortBy}⌄
                </span>
              </div>
            </div>

            <div className="max-w-xl rounded-full bg-slate-50 px-5 py-3">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                  priority={index === 0}
                />
              ))}
            </div>
          )}

          {!isLoading && !isError && !debouncedSearch && !selectedCategory && (
            <div className="mt-20 flex items-center justify-center gap-5">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-semibold text-white">
                {page}
              </span>
              <span className="font-medium">of</span>
              <span className="font-medium">{totalPages}</span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
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
