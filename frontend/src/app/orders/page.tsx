"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
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
      {loading && <p className="text-slate-500">Loading orders...</p>}
      {error && <p className="text-rose-600">{error}</p>}

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

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="premium-card flex flex-col gap-4 p-6 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg font-semibold text-slate-950">
                Order #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {order.items.length} item{order.items.length === 1 ? "" : "s"}
                {order.createdAt
                  ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="font-display text-xl font-bold text-slate-950">
                ${order.total.toFixed(2)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                {order.status}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </StaticPageShell>
  );
}
