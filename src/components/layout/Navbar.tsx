"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";
import {
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserCircle,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/favorites", label: "Favorites" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const cartCount = useCartStore((state) => state.count());
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const showCartBadge = cartHydrated && cartCount > 0;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();
    const href = query
      ? `/products?search=${encodeURIComponent(query)}`
      : "/products";

    router.push(href);
    setOpen(false);
  };

  const searchPlaceholder =
    pathname === "/favorites"
      ? "Search saved items..."
      : pathname.startsWith("/products")
      ? "Search products, tech, or AI insights..."
      : "Search products...";

  const badge = cartCount > 99 ? "99+" : cartCount;

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl"
    >
      <div className="app-container grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: nav links (desktop) + menu toggle (mobile) */}
        <div className="flex items-center justify-start gap-1">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-50 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center justify-center gap-2.5"
        >
          <span className="brand-gradient inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_rgba(0,83,219,0.35)] transition-transform group-hover:scale-105">
            <ShoppingBag size={20} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-slate-950">
            SmartCart<span className="brand-text"> AI</span>
          </span>
        </Link>

        {/* Right: search + actions */}
        <div className="flex items-center justify-end gap-1">
          <form onSubmit={handleSearch} className="hidden xl:flex">
            <label className="flex w-56 items-center gap-2.5 rounded-full border border-transparent bg-slate-100/80 px-4 py-2.5 text-slate-500 transition focus-within:border-blue-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-700/15">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="Search products"
              />
            </label>
          </form>

          {/* Desktop icon actions */}
          <div className="hidden items-center gap-1 md:flex">
            <IconAction href="/cart" label="Cart" active={isActive("/cart")}>
              <ShoppingCart size={21} />
              {showCartBadge && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                  {badge}
                </span>
              )}
            </IconAction>

            <IconAction
              href="/profile"
              label="Profile"
              active={isActive("/profile")}
            >
              <UserCircle size={22} />
            </IconAction>

            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-500"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-50 md:hidden"
          >
            <ShoppingCart size={21} />
            {showCartBadge && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                {badge}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              <form onSubmit={handleSearch} className="pb-2">
                <label className="flex items-center gap-3 rounded-full bg-slate-100/80 px-4 py-3 text-slate-500 focus-within:ring-2 focus-within:ring-blue-700/15">
                  <Search size={20} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    aria-label="Search products"
                  />
                </label>
              </form>

              {[...links, { href: "/cart", label: "Cart" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.href === "/cart" && showCartBadge && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[11px] font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function IconAction({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      {children}
    </Link>
  );
}
