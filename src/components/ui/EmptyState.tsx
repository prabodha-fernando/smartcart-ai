import { PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="mt-12 flex flex-col items-center rounded-3xl border border-slate-100 bg-slate-50/60 p-12 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon ?? <PackageOpen size={30} />}
      </span>
      <h2 className="mt-6 font-display text-2xl font-semibold text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-slate-500">{description}</p>
      {action}
    </div>
  );
}
