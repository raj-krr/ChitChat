import express from "express";
import { getAllUsers ,getMessages,sendMessages} from "../controllers/messages/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../libs/multer";
const router = express.Router();


router.get("/allusers",authMiddleware, getAllUsers);
router.get("/chat/:id", authMiddleware, getMessages);

router.post("/send/:id", authMiddleware, upload.single("file"), sendMessages);
export default router;