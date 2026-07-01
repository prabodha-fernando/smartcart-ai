import { useMutation } from "@tanstack/react-query";
import { getAIProductQuery } from "@/services/ai.service";
import {
  getProducts,
  getProductsByCategory,
  searchProducts,
} from "@/services/api";
import { Product } from "@/types/product";

export function useAIProductAssistant() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const query = await getAIProductQuery(prompt);
      let products: Product[] = [];

      if (query.category) {
        const response = await getProductsByCategory(query.category);
        products = response.products;
      } else if (query.keywords.length > 0) {
        const response = await searchProducts(query.keywords.join(" "));
        products = response.products;
      } else {
        const response = await getProducts(30, 0);
        products = response.products;
      }

      const filteredProducts = products
        .filter((product) =>
          typeof query.maxPrice === "number"
            ? product.price <= query.maxPrice
            : true
        )
        .filter((product) =>
          typeof query.minRating === "number"
            ? product.rating >= query.minRating
            : true
        )
        .slice(0, 4);

      return {
        query,
        products: filteredProducts,
      };
    },
  });
}
