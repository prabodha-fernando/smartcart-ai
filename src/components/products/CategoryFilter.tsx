import { ProductCategory } from "@/types/product";

interface CategoryFilterProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelectCategory(category.slug)}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
            selectedCategory === category.slug
              ? "bg-blue-700 text-white shadow-[0_12px_28px_rgba(0,74,198,0.2)]"
              : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          <span>{category.name}</span>
          <span className="text-xs opacity-60">→</span>
        </button>
      ))}
    </div>
  );
}
