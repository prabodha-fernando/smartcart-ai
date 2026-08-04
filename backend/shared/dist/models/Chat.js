import { Schema, model } from "mongoose";
const chatSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
}, {
    timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
export const Chat = model("Chat", chatSchema);
