import { v2 as cloudinary } from "cloudinary";

/**
 * Uploads media file to Cloudinary storage.
 * Supports auto-detection for images, videos, audio, and documents.
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
    } catch (err: any) {
      console.error("⚠️ Cloudinary upload error:", err?.message || err);
      throw new Error(`Cloudinary upload failed: ${err?.message || err}`);
    }
  }

  throw new Error("Cloudinary configuration missing in environment variables");
}
