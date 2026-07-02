"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group premium-card h-full p-6 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-white">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain"
          />
        </div>

        <h3 className="mt-5 line-clamp-2 font-display text-2xl font-semibold leading-tight text-slate-950">
          {product.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-base leading-7 text-slate-500">
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
    </motion.article>
  );
}
