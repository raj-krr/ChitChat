import { Request, Response } from "express";
import { generateSmartReplies } from "../libs/groq";
import MessageModel from "../models/message.model";
import { Types } from "mongoose";

export const getSmartReplyChips = async (req: Request, res: Response) => {
  try {
    const { chatId, groupId, receiverId } = req.body;
    const myId = req.user!.userId;

    let query: any = {};
    if (groupId && Types.ObjectId.isValid(groupId)) {
      query = { groupId: new Types.ObjectId(groupId) };
    } else if (receiverId && Types.ObjectId.isValid(receiverId)) {
      query = {
        $or: [
          { senderId: new Types.ObjectId(myId), receiverId: new Types.ObjectId(receiverId) },
          { senderId: new Types.ObjectId(receiverId), receiverId: new Types.ObjectId(myId) },
        ],
      };
    } else if (chatId) {
      query = { chatId };
    }

    const recent = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("senderId", "username");

    const formatted = recent.reverse().map((m: any) => ({
      sender: m.senderId?.username || "User",
      text: m.text || (m.file ? "[Attachment]" : ""),
    }));

    const suggestions = await generateSmartReplies(formatted);

    return res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error("AI controller error:", error);
    return res.status(200).json({
      success: true,
      suggestions: ["Sounds good! 👍", "What time works?", "Let me check!"],
    });
  }
};
