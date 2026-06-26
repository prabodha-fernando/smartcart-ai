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

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
