import { Category } from "../models/Category.js";

export class CategoryRepository {
  static async findAll() {
    return Category.find({}).sort({ slug: 1 }).lean();
  }
}
