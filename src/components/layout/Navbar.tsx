"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { LogOut, Menu, Search, UserCircle, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

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

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/categories", label: "Categories" },
    { href: "/favorites", label: "Favorites" },
    { href: "/profile", label: "Profile" },
  ];

  const searchPlaceholder =
    pathname === "/favorites"
      ? "Search saved items..."
      : pathname.startsWith("/products")
      ? "Search products, tech, or AI insights..."
      : "Search products...";

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur"
    >
      <div className="app-container flex h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display shrink-0 text-2xl font-semibold text-slate-950"
        >
          SmartCart AI
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-blue-700 ${
                pathname === link.href
                  ? "text-blue-700"
                  : "text-slate-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden min-w-0 flex-1 justify-center lg:flex"
        >
          <label className="flex w-full max-w-xl items-center gap-3 rounded-full bg-slate-50 px-5 py-3 text-slate-500 focus-within:ring-2 focus-within:ring-blue-700/20">
            <Search size={22} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:tracking-[0.15em]"
              aria-label="Search products"
            />
          </label>
        </form>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/profile"
            aria-label="Profile"
            className="text-blue-700 transition hover:opacity-70"
          >
            <UserCircle size={24} />
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="text-blue-700 transition hover:opacity-70"
          >
            <LogOut size={23} />
          </button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="flex flex-col p-4">
            <form onSubmit={handleSearch} className="pb-3">
              <label className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-3 text-slate-500 focus-within:ring-2 focus-within:ring-blue-700/20">
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

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-sm font-medium text-gray-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="py-3 text-left text-sm font-medium text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
