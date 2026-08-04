import { type HydratedDocument, type Model, Types } from "mongoose";
export interface IChat {
    userId: Types.ObjectId | string;
    senderId: string;
    receiverId: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export type ChatDocument = HydratedDocument<IChat>;
type ChatModel = Model<IChat>;
export declare const Chat: ChatModel;
export {};
