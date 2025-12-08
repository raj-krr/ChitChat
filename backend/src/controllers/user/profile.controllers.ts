import { Request, Response } from "express";
import UserMOdel from "../../models/user.model";
import { sanitizeUser } from "../../utils/sanitizeUser";
import fs from "fs";
import path from "path";
import { s3 } from "../../libs/s3";
import {
  PutObjectCommand
} from "@aws-sdk/client-s3";



export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, dob, gender ,bio} = req.body;
        const userID = req.user?.userId;

        if (!userID) {
            return res.status(401).json({ success: false, msg: "unauthorised" })
        }
        const avatarFolders: Record<string, string[]> = {
      male: ["Boy05.png", "Boy06.png", "Boy13.png", "Boy14.png", "Boy18.png", "Boy19.png", "Boy20.png","Boy02.png"],
      female: ["Girl08.png", "Girl01.png", "Girl11.png", "Girl19.png", "Girl18.png", "Girl04.png", "Girl06.png", "Girl14.png", "Girl03.png"],
      other: ["avatar1.png", "avatar2.png", "avatar3.png", "avatar4.png", "avatar5.png"],
    };

    const genderKey = gender?.toLowerCase() || "other";
    const fileList = avatarFolders[genderKey] || avatarFolders.other;


    const index = Array.from(userID.toString())
      .reduce((sum, c) => sum + c.charCodeAt(0), 0) % fileList.length;

    const avatarUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${genderKey}/${fileList[index]}`;

        const update = await UserMOdel.findByIdAndUpdate(
            userID,
            { firstName, lastName, dob, gender:genderKey ,bio, avatar:avatarUrl},
            { new: true },
        ).select("-passwoed -refreshToken");
        update?.save();

        return res.status(200).json({ success: true, msg: "profile updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, msg: "Internal server error" });
    };

};

 export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const userID = req.user?.userId;
       if (!userID) {
            return res.status(401).json({ success: false, msg: "unauthorised" })
      };
      if (!req.file) {
        return res.status(400).json({success:false,msg:"No image uploaded"})
      };

    const allowedMimeTypes =[
      "image/jpeg",
      "image/png",
      "image/svg"
    ];

if (!allowedMimeTypes.includes(req.file.mimetype)){
  fs.unlinkSync(req.file.path);
 return res.status(400).json({message:"only image is used as profile photo"});

};

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname);
    const fileKey = `user-avatars/${userID}/profile-${fileExt}`;

    // Upload to S3
    const fileContent = fs.readFileSync(filePath);
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    fs.unlinkSync(filePath);

    const photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    const updatedUser = await UserMOdel.findByIdAndUpdate(
      userID,
      { avatar: photoUrl },
      { new: true }
      ).select("-password -refreshToken");
      
      updatedUser?.save();

      res.status(200).json({
      success: true,
      msg: "Profile photo uploaded successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({success: false,msg: "Image upload failed"});
  }
};

export const getprofile = async (req: Request, res: Response) => {
    try {
        const userID = req.user?.userId;
        const user = await UserMOdel.findById(userID);

        const safeUser = sanitizeUser(user);

        return res.status(200).json({ success: true, msg: "User info:", safeUser });

    } catch (error) {
        res.status(500).json({ success: false, msg: "Internal server error" });
    };
};