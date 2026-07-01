import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { LimitedProduct } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: LimitedProduct;
  priority?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    addItem(product);
    toast.success(`${product.title} added to cart`);
  };

  return (
    <article className="group relative flex h-full flex-col rounded-[20px] border border-transparent bg-[#f9fafb] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] first:border-teal-700">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl bg-white">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain"
          />
        </div>

        <div className="mb-3 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-600 label-caps">
          In Stock
        </div>

        <h3 className="line-clamp-2 font-display text-2xl font-semibold leading-tight text-slate-950">
          {product.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-base leading-6 text-slate-500">
          AI-curated product match with a {product.rating.toFixed(1)} customer
          rating.
        </p>
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-slate-950">
          ${product.price.toFixed(2)}
        </span>
        <button
          onClick={handleAddToCart}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white transition group-hover:bg-blue-700"
          aria-label={`Add ${product.title} to cart`}
        >
          <ShoppingCart size={22} />
        </button>
      </div>
    </article>
  );
}
