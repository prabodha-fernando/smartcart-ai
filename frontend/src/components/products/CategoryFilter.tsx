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
    <>
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelectCategory(category.slug)}
          className={`whitespace-nowrap rounded-full px-6 py-3 text-base font-medium ${
            selectedCategory === category.slug
              ? "bg-blue-700 text-white"
              : "bg-slate-50 text-slate-950"
          }`}
        >
          {category.name}
        </button>
      ))}
    </>
  );
}
