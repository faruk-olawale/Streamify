import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Signup a new user
 */
export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a different one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    // Sync with Stream
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return all relevant user fields
    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
        nativeLanguages: newUser.nativeLanguages,
        learningLanguages: newUser.learningLanguages,
        location: newUser.location,
        isOnboarded: newUser.isOnboarded,
      },
    });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Login user
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Return all relevant user fields
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        profilePic: user.profilePic,
        nativeLanguages: user.nativeLanguages,
        learningLanguages: user.learningLanguages,
        location: user.location,
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Logout user
 */
export async function logout(req, res) {
  try {
    res.clearCookie("jwt");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Onboard user - IMPROVED VERSION
 */
export async function onboard(req, res) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n========== ONBOARD REQUEST [${requestId}] ==========`);

  try {
    const { fullName, bio, location, nativeLanguages, learningLanguages } = req.body;
    const userId = req.user._id;

    console.log(`[${requestId}] Request body:`, req.body);
    console.log(`[${requestId}] Native Languages:`, nativeLanguages);
    console.log(`[${requestId}] Learning Languages:`, learningLanguages);
    console.log(`[${requestId}] Native Languages Type:`, typeof nativeLanguages);
    console.log(`[${requestId}] Learning Languages Type:`, typeof learningLanguages);

    // Validate that languages are provided
    if (!nativeLanguages || (Array.isArray(nativeLanguages) && nativeLanguages.length === 0)) {
      return res.status(400).json({ 
        message: "Please select at least one native language" 
      });
    }

    if (!learningLanguages || (Array.isArray(learningLanguages) && learningLanguages.length === 0)) {
      return res.status(400).json({ 
        message: "Please select at least one language you want to learn" 
      });
    }

    const updateData = { isOnboarded: true };
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    
    // Ensure languages are arrays
    if (nativeLanguages !== undefined) {
      updateData.nativeLanguages = Array.isArray(nativeLanguages) 
        ? nativeLanguages 
        : [nativeLanguages];
    }
    
    if (learningLanguages !== undefined) {
      updateData.learningLanguages = Array.isArray(learningLanguages) 
        ? learningLanguages 
        : [learningLanguages];
    }

    console.log(`[${requestId}] Update Data:`, JSON.stringify(updateData, null, 2));

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`[${requestId}] Updated User:`, {
      id: updatedUser._id,
      nativeLanguages: updatedUser.nativeLanguages,
      learningLanguages: updatedUser.learningLanguages,
      isOnboarded: updatedUser.isOnboarded
    });

    // Sync with Stream
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`[${requestId}] Stream sync successful`);
    } catch (streamError) {
      console.log(`[${requestId}] Error syncing Stream:`, streamError.message);
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(`[${requestId}] Error in onboard:`, error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
}
