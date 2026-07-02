export default function ProductSkeleton() {
  return (
    <div className="premium-card p-6">
      <div className="skeleton-shimmer h-56 w-full rounded-xl" />
      <div className="skeleton-shimmer mt-5 h-6 w-3/4 rounded-lg" />
      <div className="mt-3 flex items-center gap-2">
        <div className="skeleton-shimmer h-4 w-24 rounded-full" />
        <div className="skeleton-shimmer h-4 w-8 rounded-full" />
      </div>
      <div className="mt-6 flex items-center justify-between pt-2">
        <div className="skeleton-shimmer h-7 w-20 rounded-lg" />
        <div className="skeleton-shimmer h-11 w-11 rounded-full" />
      </div>
    </div>
  );
}
