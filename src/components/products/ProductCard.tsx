"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { LimitedProduct } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { isOnSale, salePrice, SALE_PERCENT } from "@/lib/sale";
import toast from "react-hot-toast";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: LimitedProduct;
  priority?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) =>
    state.isFavorite(product.id)
  );

  const onSale = isOnSale(product.id);
  const displayPrice = salePrice(product.id, product.price);
  // Cart/favorites carry the discounted price so the deal follows the product.
  const saleItem: LimitedProduct = onSale
    ? { ...product, price: displayPrice }
    : product;

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    addItem(saleItem);
    toast.success(`${product.title} added to cart`);
  };

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleFavorite(saleItem);
    toast.success(
      isFavorite
        ? "Removed from favorites"
        : `${product.title} saved to favorites`
    );
  };

  const roundedRating = Math.round(product.rating);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_65px_rgba(15,23,42,0.12)]"
    >
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-blue-50 via-white to-teal-50">
          {onSale && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-[0_10px_22px_rgba(225,29,72,0.24)]">
              {SALE_PERCENT}% OFF
            </span>
          )}
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            loading="eager"
            fetchPriority={priority ? "high" : "auto"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />

          <button
            onClick={handleToggleFavorite}
            aria-label={
              isFavorite
                ? `Remove ${product.title} from favorites`
                : `Save ${product.title} to favorites`
            }
            aria-pressed={isFavorite}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-500 shadow-sm backdrop-blur transition hover:scale-110 hover:text-rose-500"
          >
            <Heart
              size={19}
              className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
            />
          </button>
        </div>

        <h3 className="mt-5 line-clamp-2 font-display text-[1.35rem] font-semibold leading-tight text-slate-950">
          {product.title}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={15}
                className={
                  index < roundedRating ? "fill-amber-400" : "text-slate-200"
                }
              />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-500">
            {product.rating.toFixed(1)}
          </span>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-slate-950">
            ${displayPrice.toFixed(2)}
          </span>
          {onSale && (
            <span className="text-sm text-slate-400 line-through">
              ${product.price.toFixed(2)}
            </span>
          )}
        </span>
        <button
          onClick={handleAddToCart}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition group-hover:bg-blue-700 group-hover:shadow-[0_14px_28px_rgba(0,74,198,0.24)]"
          aria-label={`Add ${product.title} to cart`}
        >
          <ShoppingCart size={22} />
        </button>
      </div>
    </motion.article>
  );
}
