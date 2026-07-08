
export const CATEGORIES = [
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
  "home-decoration",
  "kitchen-accessories",
  "laptops",
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "mobile-accessories",
  "motorcycle",
  "skin-care",
  "smartphones",
  "sports-accessories",
  "sunglasses",
  "tablets",
  "tops",
  "vehicle",
  "womens-bags",
  "womens-dresses",
  "womens-jewellery",
  "womens-shoes",
  "womens-watches",
] as const;

export interface AIFilters {
  category: string | null;
  brand: string | null;
  query: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  purpose: string | null;
  color: string | null;
  sort: string | null;
}

export type AIApiAction =
  | ""
  | "search_products"
  | "recommended_products"
  | "featured_products";

export interface AIDecision {
  intent: string;
  requiresApiCall: boolean;
  apiAction: AIApiAction;
  needsMoreInformation: boolean;
  missingInformation: string[];
  filters: AIFilters;
  reply: string;
  confidenceScore: number;
}
