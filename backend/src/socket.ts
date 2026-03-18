import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

export const onlineUsers = new Map<string, string>();

const userLastMessage = new Map<string, number>();
const messageTracker = new Map<string, number[]>();
const mutedUsers = new Map<string, number>();

export function initSocket(io: Server) {
  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookie);

      const token = cookies.accessToken;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as { userId: string };

      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(" SOCKET CONNECTED:", userId);

    socket.emit("online-users", Array.from(onlineUsers.keys()));

    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("user-online", userId);

    socket.on("typing", ({ to }) => {
      const socketId = onlineUsers.get(to);
      if (socketId) {
        io.to(socketId).emit("typing", {
          from: userId,
        });
      }
    });

    const handleMessage = (data: any) => {
      const now = Date.now();

      const muteEnd = mutedUsers.get(userId);
      if (muteEnd && muteEnd > now) {
        socket.emit("error", "You are temporarily muted for spam");
        return;
      }

      const lastTime = userLastMessage.get(userId) || 0;
      if (now - lastTime < 800) {
        socket.emit("error", "You're sending messages too fast");
        return;
      }
      userLastMessage.set(userId, now);

      if (!messageTracker.has(userId)) {
        messageTracker.set(userId, []);
      }

      const timestamps = messageTracker.get(userId)!;
      timestamps.push(now);

      const filtered = timestamps.filter((t) => now - t < 10000);
      messageTracker.set(userId, filtered);

      if (filtered.length > 25) {
        mutedUsers.set(userId, now + 60000); // 1 min mute
        socket.emit("error", "Spam detected. You are muted for 1 min");
        return;
      }

      if (!data?.to || !data?.message) {
        socket.emit("error", "Invalid message data");
        return;
      }

      const toSocketId = onlineUsers.get(data.to);

      if (toSocketId) {
        io.to(toSocketId).emit("receive_message", {
          from: userId,
          message: data.message,
        });
      }
    };

    socket.on("send_message", handleMessage);
    socket.on("message", handleMessage);

    socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED:", userId);

      onlineUsers.delete(userId);

      socket.broadcast.emit("user-offline", {
        userId,
        lastSeen: new Date(),
      });
    });
  });
}

setInterval(() => {
  const now = Date.now();

  for (const [userId, timestamps] of messageTracker.entries()) {
    const filtered = timestamps.filter((t) => now - t < 10000);

    if (filtered.length === 0) {
      messageTracker.delete(userId);
    } else {
      messageTracker.set(userId, filtered);
    }
  }

  for (const [userId, muteEnd] of mutedUsers.entries()) {
    if (muteEnd < now) {
      mutedUsers.delete(userId);
    }
  }
}, 30000);