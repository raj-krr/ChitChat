import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import UserMOdel from "./models/user.model";

export const onlineUsers = new Map<string, string>();
const userSockets = new Map<string, Set<string>>();

const userLastMessage = new Map<string, number>();
const messageTracker = new Map<string, number[]>();
const mutedUsers = new Map<string, number>();
const ongoingCalls = new Map<string, string>();

export function initSocket(io: Server) {
  io.use((socket, next) => {
    try {
      const authUserId = socket.handshake.auth?.userId;
      if (authUserId) {
        socket.data.userId = String(authUserId);
        return next();
      }

      const rawCookie = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookie);
      const token = cookies.accessToken;

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET!
        ) as { userId: string };

        socket.data.userId = String(decoded.userId);
        return next();
      }

      return next(new Error("Unauthorized"));
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = String(socket.data.userId);
    console.log("✅ SOCKET CONNECTED:", userId, socket.id);

    // Join Room named after userId
    socket.join(userId);

    // Track sockets per user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("user-online", userId);
    socket.emit("online-users", Array.from(onlineUsers.keys()));

    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", ({ to }) => {
      if (to) {
        io.to(String(to)).emit("typing", { from: userId });
      }
    });

    socket.on("stop-typing", ({ to }) => {
      if (to) {
        io.to(String(to)).emit("stop-typing", { from: userId });
      }
    });

    // 👥 GROUP SOCKET ROOM EVENTS
    socket.on("join-group-room", ({ groupId }) => {
      if (groupId) {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on("leave-group-room", ({ groupId }) => {
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    socket.on("group-typing", ({ groupId }) => {
      if (groupId) {
        socket.to(`group:${groupId}`).emit("group-typing", { groupId, from: userId });
      }
    });

    socket.on("group-stop-typing", ({ groupId }) => {
      if (groupId) {
        socket.to(`group:${groupId}`).emit("group-stop-typing", { groupId, from: userId });
      }
    });

    socket.on("call-user", async ({ to, offer, user, type }) => {
      if (!to || !offer) return;

      const targetId = String(to);
      if (!onlineUsers.has(targetId)) {
        socket.emit("error", "User is offline");
        return;
      }

      if (ongoingCalls.has(userId)) {
        socket.emit("error", "You are already in a call");
        return;
      }

      if (ongoingCalls.has(targetId)) {
        socket.emit("call-busy", { to: targetId });
        return;
      }

      ongoingCalls.set(userId, targetId);
      ongoingCalls.set(targetId, userId);

      let callerUser = null;
      try {
        callerUser = await UserMOdel.findById(userId).select("_id username avatar fullName email gender").lean();
      } catch (err) {}

      io.to(targetId).emit("incoming-call", {
        from: userId,
        offer,
        user: callerUser || user,
        type: type || "audio",
      });
    });

    socket.on("answer-call", ({ to, answer }) => {
      if (!to || !answer) return;
      const targetId = String(to);

      if (!ongoingCalls.has(userId)) ongoingCalls.set(userId, targetId);
      if (!ongoingCalls.has(targetId)) ongoingCalls.set(targetId, userId);

      io.to(targetId).emit("call-answered", { from: userId, answer });
    });

    socket.on("reject-call", ({ to }) => {
      const targetId = String(to);
      io.to(targetId).emit("call-rejected", { from: userId });
      ongoingCalls.delete(userId);
      ongoingCalls.delete(targetId);
    });

    socket.on("end-call", ({ to }) => {
      const targetId = String(to);
      io.to(targetId).emit("call-ended", { from: userId });
      ongoingCalls.delete(userId);
      ongoingCalls.delete(targetId);
    });

    socket.on("call-missed", ({ to }) => {
      if (!to) return;
      const targetId = String(to);
      io.to(targetId).emit("call-missed", { from: userId });
      ongoingCalls.delete(userId);
      ongoingCalls.delete(targetId);
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      if (!to || !candidate) return;
      const targetId = String(to);
      io.to(targetId).emit("ice-candidate", { from: userId, candidate });
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

      if (!messageTracker.has(userId)) messageTracker.set(userId, []);

      const timestamps = messageTracker.get(userId)!;
      timestamps.push(now);

      const filtered = timestamps.filter((t) => now - t < 10000);
      messageTracker.set(userId, filtered);

      if (filtered.length > 25) {
        mutedUsers.set(userId, now + 60000);
        socket.emit("error", "Spam detected. You are muted for 1 min");
        return;
      }

      if (!data?.to || !data?.message) {
        socket.emit("error", "Invalid message data");
        return;
      }

      const targetId = String(data.to);
      io.to(targetId).emit("receive_message", { from: userId, message: data.message });
    };

    socket.on("send_message", handleMessage);
    socket.on("message", handleMessage);

    socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED:", userId, socket.id);

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          socket.broadcast.emit("user-offline", { userId, lastSeen: new Date() });
        }
      }

      const partner = ongoingCalls.get(userId);
      if (partner) {
        io.to(partner).emit("call-ended", { from: userId });
        ongoingCalls.delete(userId);
        ongoingCalls.delete(partner);
      }
    });

  });
}

setInterval(() => {
  const now = Date.now();

  for (const [userId, timestamps] of messageTracker.entries()) {
    const filtered = timestamps.filter((t) => now - t < 10000);
    if (filtered.length === 0) messageTracker.delete(userId);
    else messageTracker.set(userId, filtered);
  }

  for (const [userId, muteEnd] of mutedUsers.entries()) {
    if (muteEnd < now) mutedUsers.delete(userId);
  }
}, 30000);