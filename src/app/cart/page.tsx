"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import { useCartStore } from "@/store/cartStore";
import { Reveal } from "@/components/ui/motion";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

const SHIPPING_FLAT = 4.99;

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.subtotal());

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const shipping = items.length > 0 ? SHIPPING_FLAT : 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    toast.success("Order placed! (demo checkout)");
    clearCart();
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container min-h-[calc(100vh-260px)] py-16">
          <Reveal>
            <h1 className="font-display text-4xl font-bold text-slate-950 md:text-5xl">
              Your Cart
            </h1>
            <p className="mt-4 text-xl text-slate-500">
              {hasHydrated && totalItems > 0
                ? `${totalItems} item${totalItems === 1 ? "" : "s"} ready for checkout.`
                : "Review the products you're ready to purchase."}
            </p>
          </Reveal>

          {hasHydrated && items.length === 0 && (
            <EmptyState
              icon={<ShoppingCart size={30} />}
              title="Your cart is empty"
              description="Browse products and add items to your cart to see them here."
              action={
                <Link
                  href="/products"
                  className="primary-pill mt-6 inline-flex px-7 py-3 text-sm font-semibold"
                >
                  Explore Products
                </Link>
              }
            />
          )}

          {items.length > 0 && (
            <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      clearCart();
                      toast.success("Cart cleared");
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                  >
                    <Trash2 size={16} />
                    Clear Cart
                  </button>
                </div>

                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="premium-card flex items-center gap-4 p-4 sm:gap-6 sm:p-5"
                    >
                      <Link
                        href={`/products/${item.id}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white"
                      >
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.id}`}
                          className="line-clamp-2 font-display text-lg font-semibold text-slate-950 hover:text-blue-700"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          ${item.price.toFixed(2)} each
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="inline-flex items-center rounded-full bg-slate-50 p-1">
                            <button
                              onClick={() => decrement(item.id)}
                              aria-label={`Decrease ${item.title} quantity`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-slate-950"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-950">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increment(item.id)}
                              aria-label={`Increase ${item.title} quantity`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-white hover:text-slate-950"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              removeItem(item.id);
                              toast.success("Removed from cart");
                            }}
                            aria-label={`Remove ${item.title} from cart`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <p className="shrink-0 font-display text-lg font-bold text-slate-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <aside className="h-fit rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-8 lg:sticky lg:top-28">
                <h2 className="font-display text-xl font-semibold text-slate-950">
                  Order Summary
                </h2>

                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <dt>Subtotal ({totalItems} items)</dt>
                    <dd className="font-medium text-slate-950">
                      ${subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-slate-950">
                      ${shipping.toFixed(2)}
                    </dd>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-base">
                    <dt className="font-semibold text-slate-950">Total</dt>
                    <dd className="font-display text-xl font-bold text-slate-950">
                      ${total.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <button
                  onClick={handleCheckout}
                  className="primary-pill mt-8 w-full py-4 text-sm font-semibold"
                >
                  Checkout
                </button>
                <Link
                  href="/products"
                  className="mt-3 block text-center text-sm font-medium text-blue-700"
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
        </section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
