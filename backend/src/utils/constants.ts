import mongoose from "mongoose";
import crypto from "crypto";

export const BOT_USER_ID = process.env.BOT_USER_ID!;

export function getChatId(userA: string, userB: string) {
  const raw = [userA, userB].sort().join("_");

  const hex = crypto
    .createHash("md5")
    .update(raw)
    .digest("hex")
    .slice(0, 24);

  return new mongoose.Types.ObjectId(hex);
}

export const ANIME_AVATARS: Record<string, string[]> = {
  male: [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Kaito&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Ren&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Hiro&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoro&backgroundColor=ffd5dc",
  ],
  female: [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Hina&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Yuki&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=c0aede",
  ],
  other: [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Robin&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Sky&backgroundColor=ffdfbf",
  ],
};

export function getDefaultAnimeAvatar(gender: string = "male", userId: string = ""): string {
  const genderKey = (gender || "male").toLowerCase();
  const list = ANIME_AVATARS[genderKey] || ANIME_AVATARS.male;
  const index =
    Array.from(userId || "user").reduce((sum, c) => sum + c.charCodeAt(0), 0) % list.length;
  return list[index];
}
