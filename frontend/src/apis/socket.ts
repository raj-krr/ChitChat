import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_API_SOCKET_URL || "https://chitchat-7hbs.onrender.com";

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("🟢 socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("❌ socket connect error:", err.message);
});

socket.io.on("reconnect", () => {
  console.log("♻️ reconnected:", socket.id);
});