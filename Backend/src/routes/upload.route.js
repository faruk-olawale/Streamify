import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";
import { uploadGroupImage } from "../controllers/upload.controller.js";

const router = express.Router();

// Add error handling for multer
router.post("/group-image", protectRoute, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("=== MULTER ERROR ===");
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);
      
      return res.status(400).json({ 
        message: "File upload error: " + err.message 
      });
    }
    next();
  });
}, uploadGroupImage);

export default router;