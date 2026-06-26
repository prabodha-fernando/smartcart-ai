import Link from "next/link";
import { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="h-40 w-full rounded-xl bg-gray-50 object-contain"
        />

        <h3 className="mt-4 line-clamp-1 font-semibold text-gray-900">
          {product.title}
        </h3>

        <p className="text-sm capitalize text-gray-500">{product.category}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-blue-600">${product.price}</span>
          <span className="text-sm text-yellow-600">⭐ {product.rating}</span>
        </div>
      </div>
    </Link>
  );
}