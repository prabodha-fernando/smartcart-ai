import axios from "axios";
import { AIProductQuery } from "@/types/product";

export async function getAIProductQuery(
  prompt: string
): Promise<AIProductQuery> {
  const response = await axios.post<AIProductQuery>("/api/ai/product-query", {
    prompt,
  });

  return response.data;
}
