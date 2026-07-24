import { Schema, model } from "mongoose";

export interface ICategory {
  slug: string;
  name: string;
  url: string;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, default: "" },
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

export const Category = model<ICategory>("Category", categorySchema);
