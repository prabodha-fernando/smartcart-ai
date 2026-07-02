"use client";

import StaticPageShell from "@/components/layout/StaticPageShell";
import { StaggerGroup, MotionItem } from "@/components/ui/motion";
import { ArrowRight, Heart, MapPin, Rocket, Sparkles, Users } from "lucide-react";
import toast from "react-hot-toast";

const roles = [
  {
    title: "Senior Frontend Engineer",
    team: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "San Francisco, CA",
    type: "Full-time",
  },
  {
    title: "ML Engineer, Recommendations",
    team: "AI",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Customer Success Specialist",
    team: "Support",
    location: "Remote",
    type: "Contract",
  },
];

const perks = [
  { icon: Rocket, title: "Growth", text: "Real ownership and room to ship." },
  { icon: Heart, title: "Wellbeing", text: "Health coverage & flexible time off." },
  { icon: Users, title: "Team", text: "Small, senior, and collaborative." },
];

export default function CareersPage() {
  return (
    <StaticPageShell
      eyebrow="Careers"
      title="Build the future of shopping"
      description="We're a small team building an AI-native storefront. If you love fast, thoughtful products, we'd love to hear from you."
    >
      <StaggerGroup className="grid gap-6 md:grid-cols-3">
        {perks.map(({ icon: Icon, title, text }) => (
          <MotionItem key={title} className="premium-card p-8" whileHover={{ y: -6 }}>
            <span className="brand-gradient inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">
              <Icon size={22} />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-slate-950">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </MotionItem>
        ))}
      </StaggerGroup>

      <div className="mt-14">
        <div className="flex items-center gap-2 text-blue-700">
          <Sparkles size={18} />
          <span className="label-caps">Open positions</span>
        </div>

        <div className="mt-6 space-y-4">
          {roles.map((role) => (
            <div
              key={role.title}
              className="premium-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-950">
                  {role.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{role.team}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {role.location}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {role.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toast.success("Application flow coming soon!")}
                className="soft-pill inline-flex items-center gap-2 self-start px-6 py-3 text-sm font-semibold sm:self-auto"
              >
                Apply
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </StaticPageShell>
  );
}
