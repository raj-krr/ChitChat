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
        return res.status(500).json({ success: false, msg: "Internal server error" });
    };
};

export const sendMessages = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const userId = req.params;
        const myId = req.user?.userId;

        const allowedMimesTypes = [
            //images
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",

            //video
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
            "video/x-matroska",
  
            // Documents
  
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];

        let fileUrl = null;
        if (req.file) {
            if (!allowedMimesTypes.includes(req.file.mimetype)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    msg: "File type not allowed"
                });
            };

            const filePath = req.file.path;
            const fileExt = path.extname(req.file.path);
            const filekey = `user-messages/${myId}/${userId}-${fileExt}`;

            const fileContent = fs.readFileSync(filePath);
            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: filekey,
                Body: fileContent,
                contentType: req.file.mimetype,
            };

            await s3.send(new PutObjectCommand(uploadParams));

            fs.unlinkSync(filePath);
        
            fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filekey}`;
  
            const message = await new MessageModal({
                senderId: myId,
                receiverId: userId,
                text,
                file: fileUrl,
            });
        
            message.save();
            return res.status(200).json({ success: true, msg: "message sent successfully" ,message});
        };
    } catch (error) {
        return res.status(500).json({ success: false, msg: "Internal server error" });
    };
};
