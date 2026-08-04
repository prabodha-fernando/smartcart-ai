import { Schema, model, type HydratedDocument, type Model, Types } from "mongoose";

export interface IChat {
  userId: Types.ObjectId | string;
  senderId: string; // The user's ID or "AI"
  receiverId: string; // "AI" or the user's ID
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatDocument = HydratedDocument<IChat>;
type ChatModel = Model<IChat>;

const chatSchema = new Schema<IChat, ChatModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
  },
  {
    timestamps: true, 
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Chat = model<IChat, ChatModel>("Chat", chatSchema);
