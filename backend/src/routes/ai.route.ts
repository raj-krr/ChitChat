import express from "express";
import { getSmartReplyChips } from "../controllers/ai.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware);
router.post("/smart-replies", getSmartReplyChips);

export default router;
