import { Product, type IProduct } from "../models/Product.js";

export class ProductRepository {
  static async findPaginated(filter: Record<string, any>, sortObj: any, skip: number, limit: number) {
    const [data, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { data, total };
  }

  static async searchPaginated(filter: Record<string, any>, sortObj: any, skip: number, limit: number, isTextSearch: boolean) {
    const projection = isTextSearch ? { score: { $meta: "textScore" } } : undefined;
    const [data, total] = await Promise.all([
      Product.find(filter, projection).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { data, total };
  }

  static async findDistinctCategories() {
    return Product.distinct("category");
  }

  static async findById(id: number) {
    return Product.findOne({ id }).lean();
  }

  static async updateById(id: number, updates: Partial<IProduct>) {
    return Product.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }
}
