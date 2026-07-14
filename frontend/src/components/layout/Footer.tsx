import Link from "next/link";
import { ArrowRight, Globe, Mail, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Categories", href: "/categories" },
      { label: "Favorites", href: "/favorites" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const socials = [
  { label: "GitHub", href: "https://github.com", icon: Globe },
  { label: "Community", href: "https://twitter.com", icon: MessageCircle },
  { label: "Email", href: "mailto:hello@smartcart.ai", icon: Mail },
];

export default function Footer() {
  return (
    <footer className="mt-20">
      {/* CTA band */}
      <div className="app-container">
        <div className="brand-gradient relative overflow-hidden rounded-[1.75rem] px-8 py-12 text-white md:px-14 md:py-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="label-caps text-white/80">Shop smarter</p>
              <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold leading-tight md:text-3xl">
                Let AI find the products that fit your life.
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Explore Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mt-14 border-t border-slate-200 bg-[#f9f9ff]">
        <div className="app-container grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="brand-gradient inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_rgba(0,83,219,0.3)]">
                <ShoppingBag size={20} />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-slate-950">
                SmartCart<span className="brand-text"> AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              Smarter shopping powered by AI — personalized recommendations,
              curated collections, and effortless discovery.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-700 hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((column) => (
            <div key={column.title}>
              <p className="label-caps text-slate-500">{column.title}</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 transition hover:text-blue-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200">
          <div className="app-container flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-500 md:flex-row">
            <p>© {new Date().getFullYear()} SmartCart AI. All rights reserved.</p>
            <p className="inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-700" />
              Built with Next.js, TanStack Query &amp; NVIDIA AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
