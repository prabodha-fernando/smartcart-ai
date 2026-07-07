// Shared AI schema/types and the catalog category list. Kept separate from the
// client and prompt builder per the recommended /lib/ai structure.

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

// Search parameters the model extracts. The AI never invents values; the
// backend turns these into an actual catalog query.
export interface AIFilters {
  category: string | null;
  brand: string | null;
  query: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  purpose: string | null;
  color: string | null;
  // How to order results: "price_asc" | "price_desc" | "rating" | "newest".
  // null defaults to rating (highest first).
  sort: string | null;
}

// The structured decision the model returns for every turn. The frontend never
// sees this — the backend inspects it to decide what to do.
export interface AIDecision {
  intent: string;
  requiresApiCall: boolean;
  apiAction: string;
  needsMoreInformation: boolean;
  missingInformation: string[];
  filters: AIFilters;
  reply: string;
  confidenceScore: number;
}
