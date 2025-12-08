import { timeStamp } from "console";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    text: { type: String },
    file: { type: String },

}, { timestamps: true },

);

const MessageModal = mongoose.model("Message", messageSchema);

export default MessageModal;