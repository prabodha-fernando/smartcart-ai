import Link from "next/link";
import { ArrowLeft, Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Compass size={32} />
        </span>

        <p className="mt-8 font-display text-7xl font-bold text-slate-950">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-slate-950">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="primary-pill inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Back Home
          </Link>
          <Link
            href="/products"
            className="soft-pill inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold"
          >
            <Search size={16} />
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
