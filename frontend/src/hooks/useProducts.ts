import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
  getProductsByCategory,
  getLimitedProducts,
} from "@/services/api";

export function useProducts(limit: number = 12, page: number = 1, sort?: string) {
  return useQuery({
    queryKey: ["products", limit, page, sort],
    queryFn: () => getProducts(limit, page, sort),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

export function useSearchProducts(query: string, sort?: string) {
  return useQuery({
    queryKey: ["products", "search", query, sort],
    queryFn: () => searchProducts(query, sort),
    enabled: query.length > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}

export function useProductsByCategory(category: string, sort?: string) {
  return useQuery({
    queryKey: ["products", "category", category, sort],
    queryFn: () => getProductsByCategory(category, sort),
    enabled: !!category,
  });
}

export function useLimitedProducts(
  limit: number,
  page: number
) {
  return useQuery({
    queryKey: ["limited-products", limit, page],
    queryFn: () => getLimitedProducts(limit, page),
  });
}

export function useInfiniteLimitedProducts(limit: number = 8) {
  return useInfiniteQuery({
    queryKey: ["limited-products", "infinite", limit],
    queryFn: ({ pageParam }) => getLimitedProducts(limit, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}