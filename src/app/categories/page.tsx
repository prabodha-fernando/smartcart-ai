"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { useCategories } from "@/hooks/useProducts";
import { Reveal, StaggerGroup, MotionItem } from "@/components/ui/motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-10 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>
          <span className="mx-3">›</span>
          <span className="text-slate-950">Categories</span>
        </section>

        <section className="app-container pb-16">
          <Reveal>
            <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
              Shop by Category
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              Browse our AI-curated collections by category.
            </p>
          </Reveal>

          {isLoading && (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && <ErrorMessage message="Failed to load categories." />}

          {!isLoading && !isError && (categories?.length ?? 0) === 0 && (
            <EmptyState
              title="No categories found"
              description="Please check back later."
            />
          )}

          {!isLoading && !isError && (categories?.length ?? 0) > 0 && (
            <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((category) => (
                <MotionItem key={category.slug} whileHover={{ y: -6 }}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group premium-card flex items-center justify-between p-8 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                  >
                    <div>
                      <p className="label-caps text-blue-700">Collection</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold capitalize text-slate-950">
                        {category.name}
                      </h2>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 transition group-hover:bg-blue-700 group-hover:text-white">
                      <ArrowRight size={20} />
                    </span>
                  </Link>
                </MotionItem>
              ))}
            </StaggerGroup>
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
