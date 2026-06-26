"use client";

import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useProduct } from "@/hooks/useProducts";
import { useParams } from "next/navigation";
import { useFavoritesStore } from "@/store/favoritesStore";
import Image from "next/image";

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, isError } = useProduct(id);

  const addFavorite = useFavoritesStore(
  (state) => state.addFavorite
  );

  const isFavorite = useFavoritesStore(
  (state) => state.isFavorite(product?.id || 0)
  );

  if (isLoading) {
    return (
        <ProtectedRoute>
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <p className="mx-auto max-w-7xl px-6 py-10">Loading product...</p>
        </main>
        </ProtectedRoute>
    );
  }

  if (isError || !product) {
    return (
        <ProtectedRoute>
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <p className="mx-auto max-w-7xl px-6 py-10 text-red-500">
            Product not found.
            </p>
        </main>
        </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gray-50">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.images?.map((image) => (
              <div
                key={image}
                className="relative h-20 w-full overflow-hidden rounded-xl border bg-gray-50"
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

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium capitalize text-blue-600">
            {product.category}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {product.title}
          </h1>

          <p className="mt-4 text-gray-600">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-bold text-blue-600">
              ${product.price}
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {product.discountPercentage}% OFF
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <InfoCard title="Rating" value={`⭐ ${product.rating}`} />
            <InfoCard title="Stock" value={`${product.stock}`} />
            <InfoCard title="Availability" value={product.availabilityStatus} />
            <InfoCard title="Shipping" value={product.shippingInformation} />
            <InfoCard title="Warranty" value={product.warrantyInformation} />
            <InfoCard title="Return Policy" value={product.returnPolicy} />
          </div>

          <button
            onClick={() => addFavorite(product)}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white"
            >
            {isFavorite
                ? "Added to Favorites"
                : "Add to Favorites"}
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>

          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <InfoCard title="Weight" value={`${product.weight} kg`} />
            <InfoCard
              title="Width"
              value={`${product.dimensions.width}`}
            />
            <InfoCard
              title="Height"
              value={`${product.dimensions.height}`}
            />
            <InfoCard
              title="Depth"
              value={`${product.dimensions.depth}`}
            />
            <InfoCard title="Brand" value={product.brand || "N/A"} />
            <InfoCard
              title="Minimum Order"
              value={`${product.minimumOrderQuantity}`}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>

          <p className="mt-2 text-gray-600">
            Ask AI whether this product is suitable for you.
          </p>

          <div className="mt-4 flex gap-3">
            <input
              placeholder="Ask: Is this product worth buying?"
              className="w-full rounded-xl border px-4 py-3"
            />

            <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
              Ask
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {product.reviews?.map((review, index) => (
              <div key={index} className="rounded-2xl bg-gray-50 p-4">
                <p className="font-semibold">⭐ {review.rating}</p>
                <p className="mt-2 text-gray-600">{review.comment}</p>
                <p className="mt-3 text-sm font-medium text-gray-900">
                  {review.reviewerName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-gray-500">{title}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}
