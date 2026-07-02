import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
  getProductsByCategory,
  getLimitedProducts,
} from "@/services/api";

export function useProducts(limit: number = 12, skip: number = 0) {
  return useQuery({
    queryKey: ["products", limit, skip],
    queryFn: () => getProducts(limit, skip),
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

export function useLimitedProducts(
  limit: number,
  skip: number
) {
  return useQuery({
    queryKey: ["limited-products", limit, skip],
    queryFn: () => getLimitedProducts(limit, skip),
  });
}

export function useInfiniteLimitedProducts(limit: number = 8) {
  return useInfiniteQuery({
    queryKey: ["limited-products", "infinite", limit],
    queryFn: ({ pageParam }) => getLimitedProducts(limit, pageParam),
    initialPageParam: 0,
    // skip = number of products already loaded on the frontend.
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (count, page) => count + page.products.length,
        0
      );

      return loaded < lastPage.total ? loaded : undefined;
    },
  });
}