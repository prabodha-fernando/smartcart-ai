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
    <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
      <button
        onClick={() => onSelectCategory("")}
        className={`rounded-full px-4 py-2 text-sm font-medium ${
          selectedCategory === ""
            ? "bg-blue-600 text-white"
            : "bg-gray-100"
        }`}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelectCategory(category.slug)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
            selectedCategory === category.slug
              ? "bg-blue-600 text-white"
              : "bg-gray-100"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
