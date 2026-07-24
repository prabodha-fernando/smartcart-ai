import { Schema, model } from "mongoose";

export interface IProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface IProduct {
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
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: IProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  images: string[];
  thumbnail: string;
}

const productSchema = new Schema<IProduct>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    stock: { type: Number, default: 0, min: 0 },
    brand: { type: String, trim: true },
    tags: { type: [String], default: [] },
    weight: { type: Number, default: 0, min: 0 },
    dimensions: {
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
    },
    warrantyInformation: { type: String, default: "" },
    shippingInformation: { type: String, default: "" },
    availabilityStatus: { type: String, default: "In Stock" },
    reviews: {
      type: [{
        rating: { type: Number, required: true, min: 0, max: 5 },
        comment: { type: String, default: "" },
        date: { type: String, default: "" },
        reviewerName: { type: String, default: "" },
        reviewerEmail: { type: String, default: "" },
      }],
      default: [],
    },
    returnPolicy: { type: String, default: "" },
    minimumOrderQuantity: { type: Number, default: 1, min: 1 },
    images: { type: [String], default: [] },
    thumbnail: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

productSchema.index({ title: "text", description: "text", brand: "text", category: "text", tags: "text" });

export const Product = model<IProduct>("Product", productSchema);
