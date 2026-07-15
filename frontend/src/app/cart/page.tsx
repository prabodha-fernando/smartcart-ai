"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EmptyState from "@/components/ui/EmptyState";
import FloatingAIAssistant from "@/components/ai/FloatingAIAssistant";
import { useCartStore } from "@/store/cartStore";
import { createOrder } from "@/services/api";
import { Reveal } from "@/components/ui/motion";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const resetLocal = useCartStore((state) => state.resetLocal);
  const subtotal = useCartStore((state) => state.subtotal());
  const [visibleCount, setVisibleCount] = useState(8);
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const total = subtotal;
  const visibleItems = items.slice(0, visibleCount);
  const showLoadMore = visibleCount < items.length;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setCheckingOut(true);
    try {
      const order = await createOrder();
      resetLocal();
      toast.success("Order placed successfully");
      router.push(`/orders/${order.id}`);
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container min-h-[calc(100vh-260px)] py-10 sm:py-14">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#071b3d_0%,#0a3d91_58%,#087c8c_100%)] px-7 py-9 text-white shadow-[0_28px_80px_rgba(7,27,61,0.22)] sm:px-10 sm:py-11">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/15 blur-2xl" />
              <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-blue-300/15 blur-3xl" />
              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50 backdrop-blur">
                    <Sparkles size={14} />
                    Secure checkout
                  </div>
                  <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    Your shopping cart
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
                    {hasHydrated && totalItems > 0
                      ? `${totalItems} item${totalItems === 1 ? "" : "s"} selected and ready for checkout.`
                      : "Review the products you're ready to purchase."}
                  </p>
                </div>
                {hasHydrated && totalItems > 0 && (
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                      Cart total
                    </p>
                    <p className="mt-1 font-display text-3xl font-bold">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
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
            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-950">
                      Cart items
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Adjust quantities or remove products before checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      clearCart();
                      toast.success("Cart cleared");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                    Clear Cart
                  </button>
                </div>

                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="group flex items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white p-4 shadow-[0_12px_38px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.1)] sm:gap-6 sm:p-5"
                    >
                      <Link
                        href={`/products/${item.id}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 sm:h-28 sm:w-28"
                      >
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          loading={index < 4 ? "eager" : "lazy"}
                          fetchPriority={index < 4 ? "high" : "auto"}
                          sizes="96px"
                          className="object-contain"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.id}`}
                          className="line-clamp-2 font-display text-lg font-bold text-slate-950 transition group-hover:text-blue-700"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">
                          ${item.price.toFixed(2)} each
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner">
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

                      <p className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 font-display text-lg font-bold text-slate-950">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {showLoadMore && (
                  <div className="pt-8 flex items-center justify-center">
                    <motion.button
                      onClick={() => setVisibleCount((count) => count + 8)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-blue-700 px-8 text-base font-semibold text-white"
                    >
                      Load More
                    </motion.button>
                  </div>
                )}
              </div>

              <aside className="h-fit overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.1)] lg:sticky lg:top-28">
                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50/60 px-7 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Summary
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                    Order total
                  </h2>
                </div>

                <dl className="space-y-4 px-7 pt-6 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <dt>Subtotal ({totalItems} items)</dt>
                    <dd className="font-medium text-slate-950">
                      ${subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-slate-950">
                      Free
                    </dd>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-dashed border-slate-300 pt-5 text-base">
                    <dt className="font-semibold text-slate-950">Total</dt>
                    <dd className="font-display text-xl font-bold text-slate-950">
                      ${total.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <div className="px-7 pb-7">
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,74,198,0.25)] transition hover:bg-blue-800 hover:shadow-[0_18px_36px_rgba(0,74,198,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkingOut ? "Placing order..." : "Proceed to checkout"}
                    {!checkingOut && <ArrowRight size={17} />}
                  </button>

                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={17} className="text-teal-600" />
                      Secure, account-protected checkout
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Truck size={17} className="text-blue-600" />
                      Flat-rate shipping on this order
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-5 text-sm font-semibold">
                    <Link href="/orders" className="text-slate-500 hover:text-blue-700">
                      Order history
                    </Link>
                    <span className="h-4 w-px bg-slate-200" />
                    <Link href="/products" className="text-blue-700 hover:text-blue-900">
                      Keep shopping
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>

        <Footer />
        <FloatingAIAssistant />
      </main>
    </ProtectedRoute>
  );
}
