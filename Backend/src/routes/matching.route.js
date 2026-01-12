// Backend/src/routes/matching.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getRecommendedPartners,
  calculateCompatibilityWithUser,
  getMatchExplanation,
  refreshMatches
} from "../controllers/matching.controller.js";

const router = express.Router();

// Get recommended practice partners
router.get("/partners", protectRoute, getRecommendedPartners);

// Calculate compatibility with specific user
router.get("/compatibility/:targetUserId", protectRoute, calculateCompatibilityWithUser);

// Get detailed match explanation
router.get("/explanation/:targetUserId", protectRoute, getMatchExplanation);

// Refresh recommendations
router.post("/refresh", protectRoute, refreshMatches);

export default router;