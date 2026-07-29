import express from "express";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  joinGroupViaInvite,
} from "../controllers/group.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../libs/multer";
import { validate } from "../middlewares/validate.middleware";
import { createGroupSchema, addMemberSchema } from "../schemas/group.schema";
import { messageLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createGroupSchema), createGroup);
router.get("/", getMyGroups);
router.get("/:groupId/messages", getGroupMessages);
router.post(
  "/:groupId/send",
  messageLimiter,
  upload.single("file"),
  sendGroupMessage
);
router.post("/:groupId/members", validate(addMemberSchema), addGroupMember);
router.post("/join/:inviteCode", joinGroupViaInvite);

export default router;
