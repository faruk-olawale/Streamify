import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";

export const getToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = req.user;

    // Upsert user in Stream
    await upsertStreamUser({
      id: userId.toString(),
      name: user.name,
      image: user.profilePicture,
    });

    // Generate token
    const token = generateStreamToken(userId);

    res.status(200).json({
      token,
      user: {
        _id: userId.toString(),
        name: user.name,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error in getToken:", error);
    res.status(500).json({ message: "Server error" });
  }
};