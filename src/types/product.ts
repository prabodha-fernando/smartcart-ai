export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;

  brand?: string;

  tags: string[];

  weight: number;

  dimensions: {
    width: number;
    height: number;
    depth: number;
  };

  warrantyInformation: string;

  shippingInformation: string;

  availabilityStatus: string;

  reviews: Review[];

  returnPolicy: string;

  minimumOrderQuantity: number;

  images: string[];

  thumbnail: string;
}

export interface ProductCategory {
  slug: string;
  name: string;
  url: string;
}

export interface LimitedProduct {
  id: number;
  title: string;
  price: number;
  rating: number;
  thumbnail: string;
}

export interface FavoriteItem extends LimitedProduct {
  addedAt: number;
  note?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface LimitedProductsResponse {
  products: LimitedProduct[];
  total: number;
  skip: number;
  limit: number;
}

export interface AIProductQuery {
  category: string | null;
  maxPrice: number | null;
  minRating: number | null;
  keywords: string[];
}

export type AIChatRole = "user" | "assistant";

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
  products?: LimitedProduct[];
}


export interface AIChatResponse {
  reply: string;
  products: LimitedProduct[];
  intent: string;
  isNewSearch: boolean;
}
