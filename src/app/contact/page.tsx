"use client";

import { FormEvent, useState } from "react";
import StaticPageShell from "@/components/layout/StaticPageShell";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import toast from "react-hot-toast";

const details = [
  { icon: Mail, label: "Email", value: "hello@smartcart.ai" },
  { icon: Phone, label: "Phone", value: "+1 (555) 018-2043" },
  { icon: MapPin, label: "Office", value: "San Francisco, CA" },
  { icon: Clock, label: "Hours", value: "Mon–Fri, 9am–6pm" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    // Demo submission — no backend endpoint in this project.
    setTimeout(() => {
      setSubmitting(false);
      setForm({ name: "", email: "", message: "" });
      toast.success("Thanks! We'll get back to you soon.");
    }, 600);
  };

  return (
    <StaticPageShell
      eyebrow="Get in touch"
      title="Contact us"
      description="Questions, feedback, or partnership ideas? Send us a message and our team will respond within one business day."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="premium-card flex items-center gap-4 p-6">
              <span className="brand-gradient inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
                <Icon size={20} />
              </span>
              <div>
                <p className="label-caps text-slate-500">{label}</p>
                <p className="mt-1 font-medium text-slate-950">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="input-base"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-base"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Message">
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="How can we help?"
                className="input-base resize-none"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="primary-pill mt-6 inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send message"}
            <Send size={16} />
          </button>
        </form>
      </div>
    </StaticPageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
