import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoute";
import meRoutes from "./routes/meRoutes";
import messageRoute from "./routes/messageRoute";
import friendRoute from "./routes/friendRoute";
import { healthCheck } from "./controllers/health.controller";
import notificationRoutes from "./routes/notificationRoute";
import { globalLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const app: Application = express();

const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ""),
  "https://chitchatt.tech",
  "https://chitchat.tech",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean) as string[];

app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.includes("chitchat")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.get("/api/health", healthCheck);

app.get("/api", (req: Request, res: Response) => {
  res.send("Server is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/message", messageRoute);
app.use("/api/friends", friendRoute);
app.use("/api/notifications", notificationRoutes);

// Centralized error handler middleware
app.use(errorHandler);

export default app;
