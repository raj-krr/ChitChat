import { Request, Response, NextFunction } from "express";

/**
 * Centralized Express Error Handling Middleware.
 * Catches unhandled errors across all controllers and formats clean JSON error responses.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("🔥 Global Error Handler Caught:", err?.stack || err?.message || err);

  // Mongoose validation error
  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      msg: "Database validation error",
      errors: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({
      success: false,
      msg: `Duplicate value entered for ${field}`,
    });
  }

  // JWT Errors
  if (err?.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      msg: "Invalid authorization token",
    });
  }

  if (err?.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      msg: "Authorization token expired",
    });
  }

  // Default fallback internal server error
  return res.status(err?.status || 500).json({
    success: false,
    msg: err?.message || "Internal server error",
  });
};
