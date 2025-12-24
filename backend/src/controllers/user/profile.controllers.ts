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
    const { firstName, lastName, dob, gender, bio } = req.body;
    const userID = req.user?.userId;

    if (!userID) {
      return res.status(401).json({ success: false, msg: "unauthorised" });
    }

    const user = await UserMOdel.findById(userID);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const updateData: any = {
      firstName,
      lastName,
      dob,
      bio,
    };


    if (gender) {
      const genderKey = gender.toLowerCase();
      updateData.gender = genderKey;

       if (user.avatarSource !== "user") {
        const avatarFolders: Record<string, string[]> = {
          male: ["Boy05.png", "Boy06.png", "Boy13.png", "Boy14.png", "Boy18.png", "Boy19.png", "Boy20.png", "Boy02.png"],
          female: ["Girl08.png", "Girl01.png", "Girl11.png", "Girl19.png", "Girl18.png", "Girl04.png", "Girl06.png", "Girl14.png", "Girl03.png"],
          other: ["avatar1.png", "avatar2.png", "avatar3.png", "avatar4.png", "avatar5.png"],
        };

        const fileList =
          avatarFolders[genderKey] || avatarFolders.other;

        const index =
          Array.from(userID.toString()).reduce(
            (sum, c) => sum + c.charCodeAt(0),
            0
          ) % fileList.length;

        updateData.avatar = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${genderKey}/${fileList[index]}`;
      }
    }


    await UserMOdel.findByIdAndUpdate(userID, updateData, {
      new: true,
    }).select("-password -refreshToken");

    return res
      .status(200)
      .json({ success: true, msg: "Profile updated successfully" });

  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, msg: "Internal server error" });
  }
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
    const fileKey = `user-avatars/${userID}/profile-${Date.now()}-${fileExt}`;

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
      {
    avatar: photoUrl,
    avatarSource: "user", 
  },
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
    if (!userID) {
      return res.status(401).json({ success: false, msg: "unauthorised" });
    }

    let user = await UserMOdel.findById(userID);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    //  AUTO-ASSIGN AVATAR IF MISSING
    if (!user.avatar) {
      const genderKey = (user.gender || "male").toLowerCase();

      const avatarFolders: Record<string, string[]> = {
        male: [
          "Boy05.png","Boy06.png","Boy13.png","Boy14.png",
          "Boy18.png","Boy19.png","Boy20.png","Boy02.png",
        ],
        female: [
          "Girl08.png","Girl01.png","Girl11.png","Girl19.png",
          "Girl18.png","Girl04.png","Girl06.png","Girl14.png","Girl03.png",
        ],
        other: ["avatar1.png","avatar2.png","avatar3.png","avatar4.png","avatar5.png"],
      };

      const list = avatarFolders[genderKey] || avatarFolders.male;

      const index =
        Array.from(userID.toString()).reduce(
          (sum, c) => sum + c.charCodeAt(0),
          0
        ) % list.length;

      user.avatar = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${genderKey}/${list[index]}`;
      user.avatarSource = "auto";

      await user.save(); 
    }

    const safeUser = sanitizeUser(user);
    return res.status(200).json({
      success: true,
      msg: "User info",
      safeUser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, msg: "Internal server error" });
  }
};
