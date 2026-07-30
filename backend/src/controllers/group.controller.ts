import { Request, Response } from "express";
import { Types } from "mongoose";
import GroupModel from "../models/group.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import { getIO } from "../socketEmitter";
import { uploadMediaFile } from "../libs/uploadHelper";
import { handleAIBotReply } from "../libs/aiBot";
import fs from "fs";

// 1️⃣ Create Group (Max 10 members)
export const createGroup = async (req: Request, res: Response) => {
  try {
    const myId = new Types.ObjectId(req.user!.userId);
    const { name, description, members: initialMembers = [] } = req.body;

    // Convert to ObjectIds and deduplicate
    const memberIdStrings = Array.from(
      new Set([myId.toString(), ...initialMembers])
    );

    if (memberIdStrings.length > 10) {
      return res.status(400).json({
        success: false,
        msg: "A group cannot have more than 10 members.",
      });
    }

    const memberObjectIds = memberIdStrings.map((id) => new Types.ObjectId(id));

    const group = await new GroupModel({
      name,
      description: description || "",
      admin: myId,
      members: memberObjectIds,
    }).save();

    const populatedGroup = await GroupModel.findById(group._id)
      .populate("members", "username avatar isBot gender")
      .populate("admin", "username avatar");

    // Notify all members via Socket.io
    const io = getIO();
    memberIdStrings.forEach((userId) => {
      io.to(userId).emit("group-created", { group: populatedGroup });
    });

    return res.status(201).json({
      success: true,
      msg: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      success: false,
      msg: error?.message || "Internal server error",
    });
  }
};

// 2️⃣ Get My Groups
export const getMyGroups = async (req: Request, res: Response) => {
  try {
    const myId = new Types.ObjectId(req.user!.userId);

    const groups = await GroupModel.find({ members: myId })
      .populate("members", "username avatar isBot gender")
      .populate("admin", "username avatar")
      .sort({ updatedAt: -1 });

    // Fetch last message for each group
    const groupsWithLastMsg = await Promise.all(
      groups.map(async (g) => {
        const lastMsg = await MessageModel.findOne({ groupId: g._id })
          .sort({ createdAt: -1 })
          .populate("senderId", "username");

        return {
          ...g.toObject(),
          lastMessage: lastMsg
            ? {
                text: lastMsg.text,
                file: lastMsg.file,
                senderName: (lastMsg.senderId as any)?.username || "User",
                createdAt: lastMsg.createdAt,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      groups: groupsWithLastMsg,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
    });
  }
};

// 3️⃣ Get Group Messages (Cursor-based Pagination)
export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const myId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 30;
    const cursor = req.query.cursor as string | undefined;

    if (!Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, msg: "Invalid groupId" });
    }

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, msg: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === myId)) {
      return res
        .status(403)
        .json({ success: false, msg: "Not a member of this group" });
    }

    const query: any = { groupId: new Types.ObjectId(groupId) };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("senderId", "username avatar isBot");

    let hasNextPage = false;
    let nextCursor: string | null = null;

    if (messages.length > limit) {
      hasNextPage = true;
      messages.pop(); // Remove extra element
      nextCursor = messages[messages.length - 1].createdAt.toISOString();
    }

    const normalized = messages.reverse().map((m) => ({
      ...m.toObject(),
      senderName: (m.senderId as any)?.username,
      senderAvatar: (m.senderId as any)?.avatar,
    }));

    return res.status(200).json({
      success: true,
      messages: normalized,
      hasNextPage,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// 4️⃣ Send Group Message (Handles file uploads & @chitchat AI trigger)
export const sendGroupMessage = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const myId = req.user!.userId;
    const { text, clientId, replyTo } = req.body;

    if (!Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, msg: "Invalid groupId" });
    }

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, msg: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === myId)) {
      return res
        .status(403)
        .json({ success: false, msg: "Not a member of this group" });
    }

    let fileUrl: string | undefined;
    if (req.file) {
      try {
        fileUrl = await uploadMediaFile({
          filePath: req.file.path,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          folder: `groups/${groupId}`,
        });
      } finally {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    if (!text && !fileUrl) {
      return res
        .status(400)
        .json({ success: false, msg: "Text or attachment required" });
    }

    const message = await new MessageModel({
      chatId: group._id, // Set chatId to groupId for consistency
      groupId: group._id,
      senderId: myId,
      text,
      file: fileUrl,
      mimeType: req.file ? req.file.mimetype : undefined,
      clientId,
      status: "sent",
      ...(replyTo && { replyTo: new Types.ObjectId(replyTo) }),
    }).save();

    const populatedMsg = await MessageModel.findById(message._id)
      .populate("senderId", "username avatar isBot")
      .lean();

    const formattedMsg = {
      ...populatedMsg,
      senderName: (populatedMsg?.senderId as any)?.username,
      senderAvatar: (populatedMsg?.senderId as any)?.avatar,
    };

    // Update group timestamp
    group.updatedAt = new Date();
    await group.save();

    // Broadcast to group room
    const io = getIO();
    io.to(`group:${groupId}`).emit("new-group-message", {
      groupId,
      message: formattedMsg,
    });

    // Check if message mentions @chitchat AI
    if (text && text.toLowerCase().includes("@chitchat")) {
      const prompt = text.replace(/@chitchat/gi, "").trim();
      handleAIBotReply({
        chatId: groupId,
        userMessage: prompt || "Hello @chitchat!",
        userId: myId,
      });
    }

    return res.status(200).json({
      success: true,
      message: formattedMsg,
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// 5️⃣ Add Member to Group (Enforces Max 10 Cap)
export const addGroupMember = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const myId = req.user!.userId;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, msg: "Group not found" });
    }

    if (group.admin.toString() !== myId) {
      return res.status(403).json({ success: false, msg: "Only group admin can add members" });
    }

    if (group.members.length >= 10) {
      return res.status(400).json({
        success: false,
        msg: "Group capacity full. Maximum limit is 10 members.",
      });
    }

    const memberObjId = new Types.ObjectId(memberId);
    if (group.members.some((m) => m.toString() === memberId)) {
      return res.status(400).json({ success: false, msg: "User is already a member" });
    }

    group.members.push(memberObjId);
    await group.save();

    const updatedGroup = await GroupModel.findById(groupId)
      .populate("members", "username avatar isBot gender")
      .populate("admin", "username avatar");

    const io = getIO();
    io.to(`group:${groupId}`).emit("group-updated", { group: updatedGroup });

    return res.status(200).json({ success: true, group: updatedGroup });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// 6️⃣ Join Group Via Invite Code (Max 10 Cap)
export const joinGroupViaInvite = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const myId = new Types.ObjectId(req.user!.userId);

    const group = await GroupModel.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ success: false, msg: "Invalid or expired invite link" });
    }

    if (group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(200).json({ success: true, msg: "Already a member", group });
    }

    if (group.members.length >= 10) {
      return res.status(400).json({
        success: false,
        msg: "Group is full (max 10 members allowed).",
      });
    }

    group.members.push(myId);
    await group.save();

    const updatedGroup = await GroupModel.findById(group._id)
      .populate("members", "username avatar isBot gender")
      .populate("admin", "username avatar");

    const io = getIO();
    io.to(`group:${group._id}`).emit("group-updated", { group: updatedGroup });

    return res.status(200).json({
      success: true,
      msg: "Joined group successfully",
      group: updatedGroup,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};
