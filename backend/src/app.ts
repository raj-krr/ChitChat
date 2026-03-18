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
const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(globalLimiter);

app.get("/api/health", healthCheck);

app.get("/api", (req: Request, res: Response) => {
  res.send("Server is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/message", messageRoute);
app.use("/api/friends", friendRoute);
app.use("/api/notifications", notificationRoutes);

export default app;
