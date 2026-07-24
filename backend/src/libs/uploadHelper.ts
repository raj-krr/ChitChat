import { s3 } from "./s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

/**
 * Uploads media file trying AWS S3 first.
 * If AWS S3 fails (credits exhausted, invalid keys, etc.),
 * it seamlessly falls back to Cloudinary.
 */
export async function uploadMediaFile({
  filePath,
  fileName,
  mimeType,
  folder = "chitchat",
}: {
  filePath: string;
  fileName: string;
  mimeType: string;
  folder?: string;
}): Promise<string> {
  // 1. Try AWS S3 first
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME
  ) {
    try {
      const fileContent = fs.readFileSync(filePath);
      const fileExt = path.extname(fileName);
      const fileKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: fileContent,
          ContentType: mimeType,
        })
      );

      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${fileKey}`;
    } catch {
      // AWS S3 failed/exhausted, fall through to Cloudinary
    }
  }

  // 2. Fallback to Cloudinary
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const uploadRes = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: "auto",
      });

      return uploadRes.secure_url;
    } catch {
      // Cloudinary failed
    }
  }

  throw new Error("Failed to upload media file");
}
