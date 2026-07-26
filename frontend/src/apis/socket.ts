import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_API_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "https://api.chitchatt.tech";

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
  timeout: 20000,
});