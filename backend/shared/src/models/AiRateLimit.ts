import { Schema, model } from "mongoose";

interface IAiRateLimit {
  key: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

const aiRateLimitSchema = new Schema<IAiRateLimit>({
  key: { type: String, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

aiRateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true });

export const AiRateLimit = model<IAiRateLimit>("AiRateLimit", aiRateLimitSchema);
