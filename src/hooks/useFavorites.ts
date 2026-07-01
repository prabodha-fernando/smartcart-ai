import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/types/product";
import { useFavoritesStore } from "@/store/favoritesStore";
import toast from "react-hot-toast";

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      useFavoritesStore.getState().addFavorite(product);
      return product;
    },
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(`${product.title} saved to favorites`);
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      useFavoritesStore.getState().removeFavorite(id);
      return id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
  });
}
