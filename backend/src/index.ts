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

    const io = new Server(server, {
      transports: ["websocket"],
      cors: {
        origin: process.env.FRONTEND_URL,
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
