"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold text-blue-600">
          SmartCart AI
        </Link>

        <div className="flex gap-6 text-sm font-medium">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/favorites">Favorites</Link>
          <Link href="/profile">Profile</Link>

          <button
            onClick={handleLogout}
            className="font-medium text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}