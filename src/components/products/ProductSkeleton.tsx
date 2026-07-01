export default function ProductSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
      <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 flex justify-between">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}