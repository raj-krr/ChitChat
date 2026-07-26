import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP
  message: {
    success: false,
    msg: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  validate: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
  message: {
    success: false,
    msg: "Too many login attempts. Try again later."
  }
});

export const messageLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 60, // max 60 messages per 10 seconds per user
  validate: false,
  keyGenerator: (req: any) => {
    return req.user?.userId || req.headers["x-forwarded-for"] || req.ip;
  },
  message: {
    success: false,
    msg: "You're sending messages too fast."
  }
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 requests per 15 min
  message: {
    success: false,
    msg: "Too many attempts. Try again later.",
  },
});

export const mediumLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    msg: "Too many requests. Slow down.",
  },
});