"use client";

import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useProducts, useSearchProducts, useCategories, useProductsByCategory, } from "@/hooks/useProducts";
import { useState } from "react";
import { Product } from "@/types/product";

export default function ProductsPage() {
  const { data: allProducts, isLoading, isError } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: categories } = useCategories();
  const { data: categoryProducts } = useProductsByCategory(selectedCategory);

  const { data: searchResults, } = useSearchProducts(search);
  
  const products =
  search.length > 0
    ? searchResults?.products
    : selectedCategory
    ? categoryProducts?.products
    : allProducts?.products;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50">
        <Navbar />

        <section className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-3xl font-bold">All Products</h1>
        {isLoading && <p className="mt-6">Loading products...</p>}
        {isError && <p className="mt-6 text-red-500">Failed to load products.</p>}

        <div className="mt-6">
        <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
        />
        </div>

        <CategoryFilter
        categories={categories || []}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products?.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}