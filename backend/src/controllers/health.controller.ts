import { Request, Response } from "express";
import mongoose from "mongoose";

export const healthCheck = async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;

  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const memoryUsage = process.memoryUsage();

  const status = {
    server: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    pid: process.pid,
    memory: {
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    database: {
      status: states[mongoState] || "unknown",
      readyState: mongoState,
    },
  };

  if (mongoState !== 1) {
    return res.status(503).json({
      success: false,
      msg: "Service degraded — database disconnected",
      ...status,
    });
  }

  return res.status(200).json({
    success: true,
    msg: "ChitChat Service Healthy",
    ...status,
  });
};

