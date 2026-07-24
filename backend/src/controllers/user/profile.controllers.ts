import { Request, Response } from "express";
import UserMOdel from "../../models/user.model";
import { sanitizeUser } from "../../utils/sanitizeUser";
import fs from "fs";
import path from "path";
import { uploadMediaFile } from "../../libs/uploadHelper";
import { getDefaultAnimeAvatar } from "../../utils/constants";





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

      if (user.avatarSource !== "user" || !user.avatar || user.avatar.includes("s3.amazonaws.com")) {
        updateData.avatar = getDefaultAnimeAvatar(genderKey, userID.toString());
        updateData.avatarSource = "auto";
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
    let photoUrl = "";

    try {
      photoUrl = await uploadMediaFile({
        filePath: filePath,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        folder: `user-avatars/${userID}`,
      });
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }


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

    // AUTO ASSIGN ANIME AVATAR IF NOT SET OR BROKEN S3 LINK
    if (!user.avatar || user.avatarSource !== "user" || user.avatar.includes("s3.amazonaws.com")) {
      const genderKey = (user.gender || "male").toLowerCase();
      user.avatar = getDefaultAnimeAvatar(genderKey, userID.toString());
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
