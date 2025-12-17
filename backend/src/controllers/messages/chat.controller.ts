import { Request, Response } from "express";
import UserMOdel from "../../models/user.model";
import MessageModal from "../../models/message.model";
import fs from "fs";
import path from "path";
import { s3 } from "../../libs/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { onlineUsers } from "../../socket";
import { getIO } from "../../socketEmitter";
import mongoose from "mongoose";

export const getMyFriends = async (req: Request, res: Response) => {
  try {
    const myId = req.user?.userId;

    const me = await UserMOdel.findById(myId).select("friends");
    if (!me) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const friends = await UserMOdel.find({
      _id: { $in: me.friends },
    }).select("-password -refreshToken");

    return res.status(200).json({
      success: true,
      msg: "Fetched friends",
      users: friends,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, msg: "Internal server error" });
  }
};

export const getChatList = async (req: Request, res: Response) => {
  try {
    const myId = new Types.ObjectId(req.user!.userId);

    const chats = await MessageModal.aggregate([
      // 1️⃣ Only messages involving me
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },

      // 2️⃣ Determine the other user
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"],
          },
        },
      },

      // 3️⃣ Sort latest messages first
      { $sort: { createdAt: -1 } },

      // 4️⃣ Group by other user
      {
        $group: {
          _id: "$otherUser",

          // latest message
          lastMessage: { $first: "$$ROOT" },

          // 🔥 unread count
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", myId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // 5️⃣ Sort chats by last message time
      {
        $sort: {
          "lastMessage.createdAt": -1,
        },
      },
    ]);

    // 6️⃣ Fetch user details
    const userIds = chats.map((c) => c._id);

    const users = await UserMOdel.find({
      _id: { $in: userIds },
    }).select("username avatar");

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 7️⃣ Build final response
    const chatList = chats.map((chat) => {
      const user = userMap.get(chat._id.toString());

      return {
        user,
        lastMessage: {
          text: chat.lastMessage.text,
          file: chat.lastMessage.file,
          senderId: chat.lastMessage.senderId,
          createdAt: chat.lastMessage.createdAt,
        },
        unreadCount: chat.unreadCount,
        lastMessageAt: chat.lastMessage.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      chats: chatList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { sender, receiver } = req.chatUsers!;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = parseInt(req.query.skip as string) || 0;

    const messages = await MessageModal.find({
      $or: [
        { senderId: sender._id, receiverId: receiver._id },
        { senderId: receiver._id, receiverId: sender._id },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "username avatar");

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
    });
  } catch {
    return res.status(500).json({ success: false });
  }
};

export const sendMessages = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const { clientId } = req.body;
    const { sender, receiver } = req.chatUsers!;

    const allowedMimesTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-matroska",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    let fileUrl: string | undefined;

    if (req.file) {
      if (!allowedMimesTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          msg: "File type not allowed",
        });
      }

      const senderIdStr = sender._id.toString();
      const receiverIdStr = receiver._id.toString();

      const fileExt = path.extname(req.file.originalname);
      const fileKey = `${senderIdStr}/${receiverIdStr}-${Date.now()}${fileExt}`;
      const fileContent = fs.readFileSync(req.file.path);

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: fileKey,
          Body: fileContent,
          ContentType: req.file.mimetype,
        })
      );

      fs.unlinkSync(req.file.path);

      fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    if (!text && !fileUrl) {
      return res.status(400).json({
        success: false,
        msg: "Message must contain text or file",
      });
    }

    const message = await MessageModal.create({
      senderId: sender._id,
      receiverId: receiver._id,
      text,
      file: fileUrl,
    });
    const receiverIdStr = receiver._id.toString();
    const senderIdStr = sender._id.toString();

    const receiverSocketId = onlineUsers.get(receiverIdStr);
    const io = getIO();

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new-message", {
        message: { ...message.toObject(), clientId },
      });

      io.to(receiverSocketId).emit("unread-update", {
        from: senderIdStr,
      });
    }
    await message.save();
    return res.status(200).json({
      success: true,
      message: {
        ...message.toObject(),
        clientId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: error,
    });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  const myId = req.user?.userId;
  const friendId = req.params.id;

  await MessageModal.updateMany(
    {
      senderId: friendId,
      receiverId: myId,
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  const io = getIO();

  const friendSocket = onlineUsers.get(friendId);
  if (friendSocket) {
    io.to(friendSocket).emit("messages-read", {
      by: myId,
    });
  }

  return res.json({ success: true });
};

export const clearChat = async (req: Request, res: Response) => {
  const myId = req.user!.userId;
  const friendId = req.params.id;

  await MessageModal.updateMany(
    {
      $or: [
        { senderId: myId, receiverId: friendId },
        { senderId: friendId, receiverId: myId },
      ],
    },
    {
      $addToSet: { deletedFor: myId },
    }
  );

  return res.json({
    success: true,
    msg: "Chat cleared for you",
  });
};

export const deleteMessageForEveryone = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId.toString();

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        msg: "Invalid message id",
      });
    }
    const message = await MessageModal.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    message.isDeleted = true;
    message.text = "";
    message.file = undefined;
    await message.save();

    const io = getIO();

    const receiverSocketId = onlineUsers.get(message.receiverId.toString());
    const senderSocketId = onlineUsers.get(userId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message-deleted", {
        messageId,
      });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("message-deleted", {
        messageId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
};

export const deleteMessageForMe = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const myId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Invalid message id" });
    }

    const message = await MessageModal.findById(messageId);
    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    if (!message.deletedFor.includes(myId)) {
      message.deletedFor.push(myId);
      await message.save();
    }

    return res.json({
      success: true,
      msg: "Message deleted for you",
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
