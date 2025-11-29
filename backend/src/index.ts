import dotenv from "dotenv";
dotenv.config();

import express,{ Application, Request, Response, NextFunction }from "express";
import mongoDb from "./libs/db";



mongoDb();
const app = express();
app.use(express.json);

import authRoutes from "./routes/authRoute"

app.get("/", (req, res) => {
  res.send("Server is running...");
});
app.use("/api/auth",authRoutes);
app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});
