
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPoll,
  getPoll,
  submitVote,
  getPollResults,
  closePoll,
  getGroupPolls
} from "../controllers/poll.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Create poll
router.post("/", createPoll);

// Get single poll
router.get("/:messageId", getPoll);

// Submit vote
router.post("/:messageId/vote", submitVote);

// Get poll results
router.get("/:messageId/results", getPollResults);

// Close poll (admin/creator only)
router.patch("/:messageId/close", closePoll);

// Get all polls in a group
router.get("/group/:groupId", getGroupPolls);

export default router;