import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getAllGroups,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  requestJoinGroup,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  makeAdmin,
  leaveGroup,
  deleteGroup
} from "../controllers/group.controller.js";

const router = express.Router();

// Group management
router.post("/create", protectRoute, createGroup);
router.get("/all", protectRoute, getAllGroups);
router.get("/my-groups", protectRoute, getUserGroups);
router.get("/:groupId", protectRoute, getGroupDetails);
router.delete("/:groupId", protectRoute, deleteGroup);

// Join requests
router.post("/:groupId/request-join", protectRoute, requestJoinGroup);
router.post("/:groupId/approve/:userId", protectRoute, approveJoinRequest);
router.post("/:groupId/reject/:userId", protectRoute, rejectJoinRequest);

// Member management
router.delete("/:groupId/members/:userId", protectRoute, removeMember);
router.post("/:groupId/make-admin/:userId", protectRoute, makeAdmin);
router.post("/:groupId/leave", protectRoute, leaveGroup);

router.patch("/:groupId", protectRoute, updateGroup);

export default router;