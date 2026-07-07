"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useProduct } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import { useFavoritesStore } from "@/store/favoritesStore";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import AIAssistant from "@/components/ai/AIAssistant";
import WhyBuyThis from "@/components/ai/WhyBuyThis";
import { Heart, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useAddFavorite, useRemoveFavorite } from "@/hooks/useFavorites";
import { isOnSale, salePrice, SALE_PERCENT } from "@/lib/sale";
import toast from "react-hot-toast";

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, isError } = useProduct(id);

  const isFavorite = useFavoritesStore(
  (state) => state.isFavorite(product?.id || 0)
  );
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addItem = useCartStore((state) => state.addItem);

  if (isLoading) {
    return (
        <ProtectedRoute>
        <main className="min-h-screen bg-white">
            <Navbar />
            <p className="app-container py-10">Loading product...</p>
        </main>
        </ProtectedRoute>
    );
  }

  if (isError || !product) {
    return (
        <ProtectedRoute>
        <main className="min-h-screen bg-white">
            <Navbar />
            <p className="app-container py-10 text-red-500">
            Product not found.
            </p>
        </main>
        </ProtectedRoute>
    );
  }

  const onSale = isOnSale(product.id);
  const displayPrice = salePrice(product.id, product.price);

  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="app-container py-10 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-950">
          Home
        </Link>
        <span className="mx-3">›</span>
        <Link
          href={`/categories/${product.category}`}
          className="capitalize hover:text-slate-950"
        >
          {product.category}
        </Link>
        <span className="mx-3">›</span>
        <span className="text-slate-950">{product.title}</span>
      </section>

      <section className="app-container grid gap-14 pb-16 lg:grid-cols-2">
        <div>
          <div className="relative rounded-[1.5rem] bg-slate-50 p-8">
            <span className="absolute left-8 top-6 z-10 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700 label-caps">
              New Release
            </span>
          <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-50">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              loading="eager"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images?.map((image) => (
              <div
                key={image}
                className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <Image
                  src={image}
                  alt={product.title}
                  fill
                  sizes="(min-width: 1024px) 12vw, 25vw"
                  className="object-contain p-2"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <p className="label-caps text-blue-700">
            {product.category}
          </p>

          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
            {product.title}
          </h1>

          <div className="mt-4 flex items-center gap-1 text-orange-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={19} fill="currentColor" />
            ))}
            <span className="ml-3 text-sm text-slate-500">
              ({Math.round(product.rating * 260)} reviews)
            </span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
              ${displayPrice.toFixed(2)}
            </span>

            <span className="text-xl text-slate-400 line-through">
              ${(onSale ? product.price : product.price * 1.12).toFixed(2)}
            </span>
            <span className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-500">
              -{onSale ? SALE_PERCENT : Math.round(product.discountPercentage)}%
            </span>
          </div>

          <p className="mt-5 border-b border-t border-slate-200 py-6 text-lg leading-8 text-slate-600">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              product.availabilityStatus,
              product.shippingInformation,
              product.warrantyInformation,
            ].map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-5">
            <Spec title="Rating" value={`${product.rating}/5`} />
            <Spec title="Stock" value={`${product.stock}`} />
          </div>

          <button
            onClick={() => {
              addItem({ ...product, price: displayPrice });
              toast.success(`${product.title} added to cart`);
            }}
            className="primary-pill mt-8 flex w-full items-center justify-center gap-3 py-4 font-semibold"
            >
            <ShoppingCart size={21} />
            Add to Cart
          </button>
          <button
            onClick={() =>
              isFavorite
                ? removeFavorite.mutate(product.id)
                : addFavorite.mutate(product)
            }
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-slate-50 py-4 font-semibold text-slate-900"
          >
            <Heart size={20} />
            {isFavorite
                ? "Added to Favorites"
                : "Add to Favorites"}
          </button>
        </div>
      </section>

      <section className="app-container pb-4">
        <WhyBuyThis product={product} />
      </section>

      <section className="app-container py-8">
        <div className="grid rounded-[1.5rem] border border-blue-100 bg-[#eef3ff] p-8 lg:grid-cols-[1.5fr_0.8fr]">
          <AIAssistant
            contextProduct={{
              id: product.id,
              title: product.title,
              price: product.price,
              rating: product.rating,
              thumbnail: product.thumbnail,
            }}
          />
          <div className="hidden items-center justify-center lg:flex">
            <div className="flex h-72 w-72 items-center justify-center rounded-full bg-blue-100 text-blue-300">
              <SparkIcon />
            </div>
          </div>
        </div>
      </section>

      <section className="app-container py-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-slate-950">
            Frequently Bought Together
          </h2>
          <Link href="/products" className="text-sm font-semibold text-blue-700">
            View All →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {product.images?.slice(0, 4).map((image, index) => (
            <div key={image} className="premium-card p-5">
              <div className="relative h-44 rounded-xl bg-white">
                <Image
                  src={image}
                  alt={`${product.title} accessory`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-contain"
                />
              </div>
              <p className="mt-4 label-caps text-slate-500">
                Accessories
              </p>
              <h3 className="mt-2 font-semibold text-slate-950">
                {["Magic Mouse", "Premium Sleeve", "USB-C Hub", "Travel Case"][index] || product.title}
              </h3>
              <p className="mt-3 font-semibold">${(79 + index * 40).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-container grid gap-10 border-t border-slate-200 py-16 lg:grid-cols-[0.45fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Customer Reviews
          </h2>
          <div className="mt-8 flex items-end gap-4">
            <span className="font-display text-4xl font-bold md:text-6xl">
              {product.rating.toFixed(1)}
            </span>
            <span className="pb-3 text-orange-400">★★★★★</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Based on {Math.round(product.rating * 260)} reviews
          </p>
        </div>

        <div className="space-y-5">
          {product.reviews?.map((review, index) => (
            <div key={index} className="rounded-2xl bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-950">
                  {review.reviewerName}
                </p>
                <span className="text-orange-400">★★★★★</span>
              </div>
              <p className="mt-3 leading-7 text-slate-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
    </ProtectedRoute>
  );
}

function Spec({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="label-caps text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SparkIcon() {
  return <span className="text-7xl">✦</span>;
}
