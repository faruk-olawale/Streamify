import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* =========================
   Ensure upload directory
========================= */
const uploadDir = path.join(process.cwd(), "uploads/voice");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================
   Multer config
========================= */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `voice-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

/* =========================
   POST /api/upload/audio
========================= */
router.post("/audio", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const audioUrl = `${req.protocol}://${req.get("host")}/uploads/voice/${req.file.filename}`;

    res.status(200).json({
      success: true,
      audioUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Audio upload error:", error);
    res.status(500).json({ message: "Audio upload failed" });
  }
});

export default router;
