import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getRecommendedUsers,
  getOutgoingFriendRequests,
  markFriendNotificationsRead,
  updateProfile
} from "../controllers/user.controller.js";
import { getUserProfile } from "../controllers/group.controller.js";

const router = express.Router();

// Apply protection to all routes
router.use(protectRoute);

// User routes
router.get("/", getRecommendedUsers);               
router.get("/friends", getMyFriends);                
router.get("/outgoing-friend-requests", getOutgoingFriendRequests);
router.get("/friend-requests", getFriendRequests);

// Friend request actions
router.post("/friend-requests/:id", sendFriendRequest);
router.put("/friend-requests/:id/accept", acceptFriendRequest);
router.patch("/friend-notifications/read", markFriendNotificationsRead);

// Profile update - REMOVE the duplicate protectRoute
router.put("/update-profile", updateProfile);

router.get("/:userId/profile", protectRoute, getUserProfile);

export default router;