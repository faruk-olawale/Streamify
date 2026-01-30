import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for images and audio
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'streamify/others';
    const allowedFormats = [];

    if (file.mimetype.startsWith('image/')) {
      folder = 'streamify/groups';
      allowedFormats.push('jpg', 'jpeg', 'png', 'gif', 'webp');
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'streamify/voice';
      allowedFormats.push('webm', 'mp3', 'wav', 'ogg');
    }

    return {
      folder,
      allowed_formats: allowedFormats,
      resource_type: file.mimetype.startsWith('audio/') ? 'raw' : 'image',
    };
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
});

export default cloudinary;
