"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Reveal } from "@/components/ui/motion";

interface StaticPageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function StaticPageShell({
  eyebrow,
  title,
  description,
  children,
}: StaticPageShellProps) {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="app-container py-8 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">
            Home
          </Link>
          <span className="mx-3">›</span>
          <span className="text-slate-950">{title}</span>
        </section>

        <section className="app-container pb-4">
          <Reveal>
            {eyebrow && <p className="label-caps text-blue-700">{eyebrow}</p>}
            <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 md:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-500">
                {description}
              </p>
            )}
          </Reveal>
        </section>

        <section className="app-container py-10">{children}</section>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
