import { Schema, model } from "mongoose";
const aiRateLimitSchema = new Schema({
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
aiRateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true });
export const AiRateLimit = model("AiRateLimit", aiRateLimitSchema);
