"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
      {loading && <p className="text-slate-500">Loading order...</p>}
      {error && (
        <div>
          <p className="text-rose-600">{error}</p>
          <Link href="/orders" className="mt-4 inline-flex font-medium text-blue-700">
            Return to order history
          </Link>
        </div>
      )}

      {order && (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="premium-card flex items-center gap-5 p-5"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-slate-950">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-7">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 font-semibold capitalize text-teal-700">
              {order.status}
            </p>
            {order.createdAt && (
              <>
                <p className="mt-5 text-sm text-slate-500">Placed</p>
                <p className="mt-1 font-medium text-slate-950">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </>
            )}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
              <span className="font-semibold text-slate-950">Total</span>
              <span className="font-display text-2xl font-bold text-slate-950">
                ${order.total.toFixed(2)}
              </span>
            </div>
            <Link
              href="/orders"
              className="mt-6 block text-center text-sm font-medium text-blue-700"
            >
              View all orders
            </Link>
          </aside>
        </div>
      )}
    </StaticPageShell>
  );
}
