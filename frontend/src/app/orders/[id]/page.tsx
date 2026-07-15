"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import StaticPageShell from "@/components/layout/StaticPageShell";
import { getOrderById, type Order } from "@/services/api";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getOrderById(id)
      .then((response) => {
        if (active) setOrder(response);
      })
      .catch(() => {
        if (active) setError("Order not found or unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <StaticPageShell
      eyebrow="Order detail"
      title={order ? `Order #${order.id.slice(-8).toUpperCase()}` : "Order"}
      description="This order preserves the product details and prices from checkout."
    >
      {loading && (
        <div className="grid animate-pulse gap-8 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-slate-100" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-slate-100" />
        </div>
      )}
      {error && (
        <div>
          <p className="text-rose-600">{error}</p>
          <Link href="/orders" className="mt-4 inline-flex font-medium text-blue-700">
            Return to order history
          </Link>
        </div>
      )}

      {order && (
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-[1.7rem] bg-[linear-gradient(115deg,#071b3d_0%,#0a3d91_58%,#087c8c_100%)] p-7 text-white shadow-[0_24px_65px_rgba(7,27,61,0.2)] sm:p-8">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cyan-300/15 blur-2xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
                  <ReceiptText size={25} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-100">
                    Order received
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">
                    Thank you for your order
                  </p>
                </div>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/15 px-4 py-2 text-sm font-semibold text-emerald-50">
                <CheckCircle2 size={17} />
                Order {order.status}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    In this order
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                    Items purchased
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.productId}
                    className="group flex items-center gap-5 rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:shadow-[0_16px_42px_rgba(15,23,42,0.09)] sm:p-5"
              >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 sm:h-24 sm:w-24">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-slate-950 transition group-hover:text-blue-700">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                    <p className="rounded-xl bg-slate-50 px-3 py-2 font-display font-bold text-slate-950">
                    ${item.lineTotal.toFixed(2)}
                </p>
              </div>
                ))}
              </div>
          </div>

            <aside className="h-fit overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.09)] lg:sticky lg:top-28">
              <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50/60 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Order summary
                </p>
                <p className="mt-1 font-display text-lg font-bold text-slate-950">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="space-y-5 px-6 py-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="font-semibold capitalize text-slate-950">{order.status}</p>
                  </div>
                </div>
            {order.createdAt && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">Placed on</p>
                      <p className="font-medium text-slate-950">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                    </div>
                  </div>
            )}
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <PackageCheck size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Products</p>
                    <p className="font-medium text-slate-950">{order.items.length} purchased</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Checkout</p>
                    <p className="font-medium text-slate-950">Securely submitted</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-dashed border-slate-300 px-6 py-5">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-950">Order total</span>
                  <span className="font-display text-2xl font-bold text-slate-950">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
            <Link
              href="/orders"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
                  <ArrowLeft size={16} />
              View all orders
            </Link>
              </div>
          </aside>
          </div>
        </div>
      )}
    </StaticPageShell>
  );
}
