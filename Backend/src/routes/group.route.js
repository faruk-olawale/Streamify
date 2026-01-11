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
  deleteGroup,
  getGroupNotifications,
  markGroupNotificationsRead,
  getUnreadNotificationCount,
  addMemberDirectly,
  getAvailableFriendsForGroup
} from "../controllers/group.controller.js";

const router = express.Router();

// Notification routes (must come before :groupId routes)
router.get("/notifications/all", protectRoute, getGroupNotifications);
router.get("/notifications/unread-count", protectRoute, getUnreadNotificationCount);
router.patch("/notifications/read", protectRoute, markGroupNotificationsRead);

// Group management
router.post("/create", protectRoute, createGroup);
router.get("/all", protectRoute, getAllGroups);
router.get("/my-groups", protectRoute, getUserGroups);

// Group-specific routes
router.get("/:groupId/available-friends", protectRoute, getAvailableFriendsForGroup);
router.get("/:groupId", protectRoute, getGroupDetails);
router.patch("/:groupId", protectRoute, updateGroup);
router.delete("/:groupId", protectRoute, deleteGroup);

// Join requests
router.post("/:groupId/request-join", protectRoute, requestJoinGroup);
router.post("/:groupId/approve/:userId", protectRoute, approveJoinRequest);
router.post("/:groupId/reject/:userId", protectRoute, rejectJoinRequest);

// Member management
router.post("/:groupId/add-member", protectRoute, addMemberDirectly); // ✅ FIXED
router.delete("/:groupId/members/:userId", protectRoute, removeMember);
router.post("/:groupId/make-admin/:userId", protectRoute, makeAdmin);
router.post("/:groupId/leave", protectRoute, leaveGroup);

export default router;

