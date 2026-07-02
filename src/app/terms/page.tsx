"use client";

import StaticPageShell from "@/components/layout/StaticPageShell";

const sections = [
  {
    title: "Acceptance of terms",
    body: "By accessing or using SmartCart AI, you agree to these Terms of Service. If you don't agree, please don't use the app.",
  },
  {
    title: "Use of the service",
    body: "SmartCart AI is provided for personal, non-commercial use. You agree not to misuse the service, attempt to disrupt it, or access it through unauthorized means.",
  },
  {
    title: "Accounts",
    body: "You're responsible for activity under your account and for keeping your credentials secure. Demo and local accounts are provided for evaluation purposes.",
  },
  {
    title: "Product information",
    body: "Product data is provided by a third-party catalog (DummyJSON) for demonstration. Prices, availability, and details may not reflect real-world offers.",
  },
  {
    title: "AI recommendations",
    body: "AI-generated recommendations are suggestions only and may be inaccurate. Always review product details before making decisions.",
  },
  {
    title: "Limitation of liability",
    body: "The service is provided “as is” without warranties of any kind. We are not liable for any damages arising from your use of the app.",
  },
  {
    title: "Changes",
    body: "We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="The rules and guidelines for using SmartCart AI."
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <p className="text-sm text-slate-400">Last updated: January 2026</p>
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-xl font-semibold text-slate-950">
              {section.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
          </div>
        ))}
      </div>
    </StaticPageShell>
  );
}
