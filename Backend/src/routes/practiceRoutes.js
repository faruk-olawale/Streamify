import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import { recordPracticeSession, getPracticeStats } from "../controllers/practiceController.js";

const router = express.Router();

router.post("/record", protectRoute, recordPracticeSession);
router.get("/stats", protectRoute, getPracticeStats);

export default router;