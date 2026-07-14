"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  PackageCheck,
  ReceiptText,
} from "lucide-react";
import StaticPageShell from "@/components/layout/StaticPageShell";
import EmptyState from "@/components/ui/EmptyState";
import { getOrders, type Order } from "@/services/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getOrders()
      .then((response) => {
        if (active) setOrders(response.orders);
      })
      .catch(() => {
        if (active) setError("Unable to load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <StaticPageShell
      eyebrow="Purchase history"
      title="Your Orders"
      description="Review completed checkouts and the prices captured at purchase time."
    >
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[1.5rem] border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={<PackageCheck size={30} />}
          title="No orders yet"
          description="When you complete checkout, your order history will appear here."
          action={
            <Link
              href="/products"
              className="primary-pill mt-6 inline-flex px-7 py-3 text-sm font-semibold"
            >
              Browse products
            </Link>
          }
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <ReceiptText className="text-blue-700" size={22} />
              <p className="mt-4 text-3xl font-bold text-slate-950">{orders.length}</p>
              <p className="mt-1 text-sm text-slate-500">Total orders shown</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
              <PackageCheck className="text-teal-700" size={22} />
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {orders.reduce((total, order) => total + order.items.length, 0)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Products purchased</p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
              <CheckCircle2 className="text-violet-700" size={22} />
              <p className="mt-4 text-3xl font-bold text-slate-950">
                {orders.filter((order) => order.status === "paid").length}
              </p>
              <p className="mt-1 text-sm text-slate-500">Completed payments</p>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Recent activity
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-950">
                  Order history
                </h2>
              </div>
              <p className="hidden text-sm text-slate-400 sm:block">
                Select an order to view details
              </p>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group flex flex-col gap-5 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] sm:flex-row sm:items-center"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 text-white shadow-[0_10px_24px_rgba(0,74,198,0.2)]">
                    <ReceiptText size={23} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-lg font-bold text-slate-950">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <PackageCheck size={15} />
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </span>
                      {order.createdAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Total
                      </p>
                      <p className="mt-1 font-display text-xl font-bold text-slate-950">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-blue-700 group-hover:bg-blue-700 group-hover:text-white">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </StaticPageShell>
  );
}
