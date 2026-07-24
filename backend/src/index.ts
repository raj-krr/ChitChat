import dotenv from "dotenv";
dotenv.config();

import { initEmailTransporter } from "./libs/emailConfig";

import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { initSocket } from "./socket";
import { setIO } from "./socketEmitter";
import mongoDb from "./libs/db";

const port = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await mongoDb();
    console.log("MongoDB is connected");

    initEmailTransporter();
    
    const server = http.createServer(app);

    const allowedOrigins = [
      process.env.FRONTEND_URL?.replace(/\/$/, ""),
      "http://localhost:5173",
    ].filter(Boolean);

    const io = new Server(server, {
      transports: ["polling", "websocket"],
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const cleanOrigin = origin.replace(/\/$/, "");
          if (allowedOrigins.includes(cleanOrigin) || origin.endsWith(".vercel.app")) {
            return callback(null, true);
          }
          return callback(new Error("CORS Policy Violation"));
        },
        credentials: true,
      },
    });

    setIO(io);
    initSocket(io);

    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start", err);
    process.exit(1);
  }
}

startServer();
