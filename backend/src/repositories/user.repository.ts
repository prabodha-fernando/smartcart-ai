import { User, hashEmail, type UserDocument } from "../models/User.js";
import type { RegisterInput } from "../validators/auth.validator.js";

export class UserRepository {
  static async findByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ emailHash: hashEmail(email) }).select("+password +tokenVersion") as unknown as Promise<UserDocument | null>;
  }

  static async findById(id: string): Promise<UserDocument | null> {
    return User.findById(id);
  }

  static async create(input: RegisterInput): Promise<UserDocument> {
    const user = await User.create(input);
    (user as any).decryptFieldsSync();
    return user;
  }

  static async incrementTokenVersion(id: string, currentVersion: number): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { _id: id, tokenVersion: currentVersion },
      { $inc: { tokenVersion: 1 } },
      { new: true }
    ).select("+tokenVersion") as unknown as Promise<UserDocument | null>;
  }
}
