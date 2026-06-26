"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/favorites", label: "Favorites" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-bold text-blue-600"
        >
          SmartCart AI
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 transition hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 transition hover:text-red-600"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="flex flex-col p-4">
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
    </nav>
  );
}