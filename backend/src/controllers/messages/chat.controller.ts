import { Request, Response } from "express";
import UserMOdel from "../../models/user.model";
import MessageModal from "../../models/message.model";
import fs from "fs";
import path from "path";
import { s3 } from "../../libs/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const getAllUsers = async (req: Request, res: Response) => {
    
    try {
        const loggedInUserId = req.user?.userId;
        const allusers = await UserMOdel.find({ _id: { $ne: loggedInUserId } }).select("-password -refreshToken");

        return res.status(200).json({ success: true, msg: "fetched all users", allusers });
    } catch (error) {
        return res.status(500).json({ success: false, msg: "Internal server error" });
    };
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.params;
        const myId = req.user?.userId;

        const messages = await MessageModal.find({
            $or: [
                { senderId: myId, receiverId: userId },
                { senderId: userId, receiverId: myId },
            ]
        })

        return res.status(200).json({ success: true, msg: "Messages between sender and receiver", messages });
    } catch (error) {
        return res.status(500).json({ success: false, msg: "Internal server error",error });
    };
};

export const sendMessages = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user?.userId;

        const allowedMimesTypes = [
            // Images
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",

            // Videos
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-matroska",

            // Docs
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        let fileUrl: string | null = null;

        if (req.file) {
            if (!allowedMimesTypes.includes(req.file.mimetype)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, msg: "File type not allowed" });
            }

            const fileExt = path.extname(req.file.originalname);
            const fileKey = `user-messages/${senderId}/${receiverId}-${Date.now()}${fileExt}`;

            const fileContent = fs.readFileSync(req.file.path);

            await s3.send(new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: fileKey,
                Body: fileContent,
                ContentType: req.file.mimetype,
            }));

            fs.unlinkSync(req.file.path);

            fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        }

        // 2️⃣ REQUIRE text or file (at least one must exist)
        if (!text && !fileUrl) {
            return res.status(400).json({
                success: false,
                msg: "Message must contain text or file"
            });
        }

        // 3️⃣ Save message
        const message = new MessageModal({
            senderId,
            receiverId,
            text,
            file: fileUrl
        });

        await message.save();

        return res.status(200).json({
            success: true,
            msg: "Message sent successfully",
            message
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
};
