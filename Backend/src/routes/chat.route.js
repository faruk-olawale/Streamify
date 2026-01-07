import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getToken } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getToken);

export default router;