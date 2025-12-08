import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import mongoDb from "./libs/db";
import authRoutes from "./routes/authRoute";
import meRoutes from "./routes/meRoutes";
import messageRoute from "./routes/messageRoute"
import { healthCheck } from "./controllers/health.controller";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());

mongoDb();

app.get("/api/health",healthCheck)
  
app.get("/api/", (req: Request, res: Response) => {
  res.send("Server is running ....");
});
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/message", messageRoute);

const port: number = parseInt(process.env.PORT || "5000", 10);

const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

// Start server
app.listen(port, host, () => {
  console.log(` Server running on http://${host}:${port}`);
});
