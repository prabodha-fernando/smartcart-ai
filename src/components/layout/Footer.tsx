import { AtSign, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-[#f9f9ff]">
      <div className="app-container flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold text-slate-950">
            SmartCart AI
          </p>
          <p className="mt-2 text-sm text-slate-500">
            © 2024 SmartCart AI. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
          <a href="#" className="transition hover:text-blue-700">
            Privacy Policy
          </a>
          <a href="#" className="transition hover:text-blue-700">
            Terms of Service
          </a>
          <a href="#" className="transition hover:text-blue-700">
            Help Center
          </a>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <AtSign size={15} />
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <HelpCircle size={15} />
          </span>
        </div>
      </div>
    </footer>
  );
}
