import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

/* =====================
   Configure Cloudinary
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =====================
   Multer Cloudinary Storage
===================== */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "streamify/voice",
    resource_type: "video", // Cloudinary treats audio as 'video'
    format: "webm", // default format
    allowed_formats: ["webm", "mp3", "wav", "m4a", "ogg"],
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
});

/* =====================
   POST /api/upload/audio
===================== */
router.post("/audio", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No audio uploaded" });

    // Cloudinary stores file info in req.file
    const fileUrl = req.file.path; // Cloudinary URL

    res.status(200).json({
      success: true,
      fileUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error("Voice upload error:", err);
    res.status(500).json({ success: false, message: "Audio upload failed" });
  }
});

export default router;
