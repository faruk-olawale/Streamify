export const uploadGroupImage = async (req, res) => {
  try {
    console.log("=== UPLOAD CONTROLLER START ===");
    console.log("Request file:", req.file);
    console.log("Request body:", req.body);
    
    if (!req.file) {
      console.error("❌ No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("✓ File received:", req.file.originalname);
    console.log("✓ File path:", req.file.path);
    
    // Cloudinary URL is automatically available in req.file.path
    const imageUrl = req.file.path;
    
    console.log("✓ Image URL:", imageUrl);
    console.log("=== UPLOAD SUCCESS ===");

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Failed to upload image",
      error: error.message 
    });
  }
};