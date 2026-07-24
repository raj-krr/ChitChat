import crypto from "crypto";
import MessageModal from "../models/message.model";
import { getIO } from "../socketEmitter";
import { onlineUsers } from "../socket";
import { BOT_USER_ID } from "../utils/constants";
import { callGroq, ChatMessage } from "./groq";

function fakeAIReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("hello") || msg.includes("hi"))
    return "Hey! What's up?";

  if (msg.includes("how are you"))
    return "I'm doing good, just chilling. You?";

  if (msg.includes("help"))
    return "Sure, tell me what you need.";

  if (msg.includes("bye"))
    return "Bye, take care!";

  if (msg.includes("thanks"))
    return "Anytime!";

  return "Haha, tell me more!";
}

export async function handleAIBotReply({
  chatId,
  userMessage,
  userId,
}: {
  chatId: string;
  userMessage: string;
  userId: string;
}) {
  const io = getIO();
  const socketId = onlineUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit("typing", { from: BOT_USER_ID });
  }

  // Fetch recent conversation context
  const history = await MessageModal.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const formattedMessages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are ChitChat AI, a friendly and casual texting buddy. Keep your replies short, natural, and conversational, like a real person sending a text message. Do NOT spam or overuse emojis — use at most one emoji only when it feels natural, otherwise use no emojis at all.",
    },
  ];

  history.reverse().forEach((m) => {
    formattedMessages.push({
      role: m.senderId.toString() === BOT_USER_ID ? "assistant" : "user",
      content: m.text || "",
    });
  });

  formattedMessages.push({
    role: "user",
    content: userMessage,
  });

  let reply = "Got it.";

  try {
    reply = await callGroq(formattedMessages);
  } catch (err: any) {
    console.warn("⚠️ Groq API failed, using fallback reply:", err?.message || err);
    reply = fakeAIReply(userMessage);
  }

  await new Promise((r) =>
    setTimeout(r, Math.min(1200, reply.length * 18))
  );

  const botMsg = await MessageModal.create({
    chatId,
    senderId: BOT_USER_ID,
    receiverId: userId,
    text: reply,
    status: "sent",
    isRead: true,
    clientId: crypto.randomUUID(),
  });

  if (socketId) {
    io.to(socketId).emit("stop-typing", { from: BOT_USER_ID });
    io.to(socketId).emit("new-message", {
      message: botMsg,
    });
  }
}
