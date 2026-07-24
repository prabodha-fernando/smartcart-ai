import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import mongooseFieldEncryption from "mongoose-field-encryption";
import { env } from "../config/env.js";

const { fieldEncryption } = mongooseFieldEncryption as any;

export interface IUser {
  name: string;
  email: string;
  emailHash: string; // Used for deterministic querying (e.g. login)
  password: string;
  tokenVersion: number;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    emailHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.emailHash;
        delete ret.__enc_email;
        delete ret.__enc_name;
        return ret;
      },
    },
  }
);

userSchema.plugin(fieldEncryption, {
  fields: ["name", "email"],
  secret: env.ENCRYPTION_KEY,
});

userSchema.pre("validate", function hashFields(next) {
  if (this.isModified("email") && this.email) {
    this.emailHash = hashEmail(this.email);
  }
  next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export function hashEmail(email: string): string {
  return crypto
    .createHmac("sha256", env.ENCRYPTION_KEY)
    .update(email.toLowerCase().trim())
    .digest("hex");
}

userSchema.methods.comparePassword = function comparePassword(
  this: UserDocument,
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, UserModel>("User", userSchema);
