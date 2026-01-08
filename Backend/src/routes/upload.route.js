import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";
import { uploadGroupImage } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/group-image", protectRoute, upload.single("image"), uploadGroupImage);

export default router;