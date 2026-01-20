import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";
import { sortByMatchScore, filterByPreferences } from "../utils/matchScoring.js";

/**
 * Get recommended users with match scoring
 * NOW WITH: Match percentage, reasons, and intelligent sorting
 */
export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Fetch potential matches
    let recommendedUsers = await User.find({
      _id: { $nin: [currentUser._id, ...currentUser.friends] },
      isOnboarded: true,
    }).select(
      "fullName profilePic bio nativeLanguages learningLanguages location proficiencyLevels learningGoals lastActive"
    );

    // Apply user preferences (if any)
    recommendedUsers = filterByPreferences(recommendedUsers, currentUser);

    // Calculate match scores and sort
    const scoredUsers = sortByMatchScore(recommendedUsers, currentUser);

    // Return top matches (you can add pagination here)
    res.status(200).json(scoredUsers);
  } catch (err) {
    console.error("getRecommendedUsers error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get user's friends
 */
export const getMyFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friends",
      "fullName profilePic bio nativeLanguages learningLanguages location proficiencyLevels learningGoals"
    );
    res.status(200).json(user.friends || []);
  } catch (err) {
    console.error("getMyFriends error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get outgoing friend requests
 */
export const getOutgoingFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic bio nativeLanguages learningLanguages location"
    );

    res.status(200).json(requests || []);
  } catch (err) {
    console.error("getOutgoingFriendRequests error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const recipientId = req.params.id;

    if (senderId === recipientId)
      return res.status(400).json({ message: "Cannot send request to yourself" });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    if (recipient.friends.includes(senderId))
      return res.status(400).json({ message: "Already friends" });

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });
    if (existing) return res.status(400).json({ message: "Request already exists" });

    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (err) {
    console.error("sendFriendRequest error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.recipient.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } });
    await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("acceptFriendRequest error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get incoming friend requests and accepted requests notifications
 */
export const getFriendRequests = async (req, res) => {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic bio nativeLanguages learningLanguages location"
    );

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate(
      "recipient",
      "fullName profilePic bio nativeLanguages learningLanguages location"
    );

    res.status(200).json({
      incomingReqs: incomingReqs || [],
      acceptedReqs: acceptedReqs || [],
    });
  } catch (err) {
    console.error("getFriendRequests error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Mark friend notifications as read
 */
export const markFriendNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestIds, type } = req.body;

    if (requestIds && Array.isArray(requestIds) && requestIds.length > 0) {
      if (type === "accepted") {
        await FriendRequest.updateMany(
          { _id: { $in: requestIds }, status: 'accepted' },
          { read: true }
        );
      } else {
        await FriendRequest.updateMany(
          { _id: { $in: requestIds } },
          { read: true }
        );
      }
    } else {
      await FriendRequest.updateMany(
        { 
          $or: [
            { recipient: userId, read: false },
            { sender: userId, status: 'accepted', read: false }
          ]
        },
        { read: true }
      );
    }

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking friend notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile - ENHANCED with new fields
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { 
      fullName, 
      bio, 
      location, 
      profilePic, 
      nativeLanguages, 
      learningLanguages,
      learningGoals,
      availability,
      proficiencyLevels,
      matchPreferences
    } = req.body;

    // Build update object
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profilePic !== undefined) updateData.profilePic = profilePic;
    if (nativeLanguages !== undefined) updateData.nativeLanguages = nativeLanguages;
    if (learningLanguages !== undefined) updateData.learningLanguages = learningLanguages;
    if (learningGoals !== undefined) updateData.learningGoals = learningGoals;
    if (availability !== undefined) updateData.availability = availability;
    if (proficiencyLevels !== undefined) updateData.proficiencyLevels = proficiencyLevels;
    if (matchPreferences !== undefined) updateData.matchPreferences = matchPreferences;

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sync with Stream if name or pic changed
    if (fullName !== undefined || profilePic !== undefined) {
      try {
        await upsertStreamUser({
          id: updatedUser._id.toString(),
          name: updatedUser.fullName,
          image: updatedUser.profilePic || "",
        });
      } catch (streamError) {
        console.log("Error syncing with Stream:", streamError.message);
      }
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log("❌ Error in updateProfile controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}