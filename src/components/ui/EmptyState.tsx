interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="mt-6 rounded-3xl border bg-white p-10 text-center shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-500">{description}</p>
    </div>
  );
}