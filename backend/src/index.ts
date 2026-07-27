import dotenv from "dotenv";
dotenv.config();

import { initEmailTransporter } from "./libs/emailConfig";

import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { initSocket } from "./socket";
import { setIO } from "./socketEmitter";
import mongoDb from "./libs/db";
import mongoose from "mongoose";

const port = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await mongoDb();
    console.log("MongoDB is connected");

    initEmailTransporter();
    
    const server = http.createServer(app);

    const allowedOrigins = [
      process.env.FRONTEND_URL?.replace(/\/$/, ""),
      "https://chitchatt.tech",
      "http://localhost:5173",
      "http://localhost:3000",
    ].filter(Boolean) as string[];

    const io = new Server(server, {
      transports: ["websocket", "polling"],
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const cleanOrigin = origin.replace(/\/$/, "");
          if (
            allowedOrigins.includes(cleanOrigin) ||
            cleanOrigin.includes("chitchat")
          ) {
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

    // Graceful Shutdown Logic
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      // Stop receiving new HTTP requests
      server.close(async () => {
        console.log("🔒 HTTP Server closed.");

        // Disconnect all socket connections
        try {
          io.close();
          console.log("🔌 Socket.io connections closed.");
        } catch (err) {
          console.error("Error closing Socket.io:", err);
        }

        // Close MongoDB connection
        try {
          await mongoose.connection.close();
          console.log("🍃 MongoDB connection closed.");
        } catch (err) {
          console.error("Error closing MongoDB connection:", err);
        }

        console.log("👋 Graceful shutdown complete. Exiting.");
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error("⚠️ Forced shutdown after 10s timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    console.error("❌ Server failed to start", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
});

startServer();

