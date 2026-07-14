"use client";

import StaticPageShell from "@/components/layout/StaticPageShell";

const sections = [
  {
    title: "Information we collect",
    body: "We collect the information you provide when you sign in or create an account (such as your name and email) and basic usage data needed to run the app, like your saved favorites and cart.",
  },
  {
    title: "How we use your information",
    body: "Your information is used to authenticate you, personalize recommendations, remember your favorites and cart, and improve the overall shopping experience.",
  },
  {
    title: "AI queries",
    body: "When you use the AI assistant, your prompt is sent to our AI provider to generate a structured product query. We don't use your prompts to build advertising profiles.",
  },
  {
    title: "Data storage",
    body: "Favorites and cart data are stored locally in your browser. Authentication tokens are kept only for the duration of your session and refreshed securely.",
  },
  {
    title: "Your choices",
    body: "You can clear your favorites and cart at any time, and sign out to remove your session. Local data can also be cleared from your browser settings.",
  },
  {
    title: "Contact",
    body: "For any privacy questions, reach us at hello@smartcart.ai.",
  },
];

export default function PrivacyPage() {
  return (
    <StaticPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="How SmartCart AI collects, uses, and protects your information."
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
