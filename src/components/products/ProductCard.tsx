import Link from "next/link";
import Image from "next/image";
import { LimitedProduct } from "@/types/product";

export default function ProductCard({
  product,
}: {
  product: LimitedProduct;
}) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-50">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain"
          />
        </div>

        <h3 className="mt-4 line-clamp-1 font-semibold text-gray-900">
          {product.title}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-blue-600">${product.price}</span>
          <span className="text-sm text-yellow-600">⭐ {product.rating}</span>
        </div>
      </div>
    </Link>
  );
}
