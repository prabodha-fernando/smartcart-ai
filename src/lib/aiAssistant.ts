import { Product } from "@/types/product";

export function generateAIRecommendation(
  question: string,
  products: Product[]
): string {
  const lowerQuestion = question.toLowerCase();

  if (!question.trim()) {
    return "Please enter a shopping question.";
  }

  if (lowerQuestion.includes("cheap") || lowerQuestion.includes("budget")) {
    const cheapest = [...products].sort((a, b) => a.price - b.price)[0];

    return `For a budget-friendly choice, I recommend ${cheapest.title}. It costs $${cheapest.price} and has a rating of ${cheapest.rating}.`;
  }

  if (lowerQuestion.includes("best") || lowerQuestion.includes("recommend")) {
    const bestRated = [...products].sort((a, b) => b.rating - a.rating)[0];

    return `The best recommendation is ${bestRated.title}. It has a ${bestRated.rating} rating and belongs to the ${bestRated.category} category.`;
  }

  if (lowerQuestion.includes("gift")) {
    const giftProduct = products.find((item) => item.rating >= 4) || products[0];

    return `${giftProduct.title} could be a good gift option because it has strong customer ratings and useful product features.`;
  }

  return "Based on your question, I recommend checking highly rated products with good stock availability, warranty, and shipping information.";
}