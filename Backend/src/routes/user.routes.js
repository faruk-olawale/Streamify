import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyFriends,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
  getRecommendedUsers,
  getOutgoingFriendRequests,
  markFriendNotificationsRead
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers);                 // recommended users
router.get("/friends", getMyFriends);                // user's friends
router.get("/outgoing-friend-requests", getOutgoingFriendRequests);

router.post("/friend-requests/:id", sendFriendRequest);
router.put("/friend-requests/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);  // incoming requests

// Add this route
router.patch("/friend-notifications/read", protectRoute, markFriendNotificationsRead);

export default router;
