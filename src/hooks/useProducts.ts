import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
  getProductsByCategory,
} from "@/services/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => searchProducts(query),
    enabled: query.length > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}

export function useProductsByCategory(category: string) {
  return useQuery({
    queryKey: ["products", "category", category],
    queryFn: () => getProductsByCategory(category),
    enabled: !!category,
  });
}