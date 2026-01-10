import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

/**
 * Get recommended users (exclude self and friends)
 */
export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const recommendedUsers = await User.find({
      _id: { $nin: [currentUser._id, ...currentUser.friends] },
      isOnboarded: true,
    }).select(
      "fullName profilePic bio nativeLanguages learningLanguages location"
    );

    res.status(200).json(recommendedUsers);
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
      "fullName profilePic bio nativeLanguages learningLanguages location"
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
 * Returns: { incomingReqs: [], acceptedReqs: [] }
 */
export const getFriendRequests = async (req, res) => {
  try {
    // Get incoming pending requests (where current user is recipient)
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic bio nativeLanguages learningLanguages location"
    );

    // Get accepted requests where current user was the sender
    // These are notifications that someone accepted your friend request
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


// ... existing functions

// Mark friend notifications as read
export const markFriendNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { requestIds, type } = req.body;

    console.log("=== MARK FRIEND NOTIFICATIONS READ ===");
    console.log("User ID:", userId);
    console.log("Request IDs:", requestIds);
    console.log("Type:", type);

    if (requestIds && Array.isArray(requestIds) && requestIds.length > 0) {
      // Mark specific requests as read
      if (type === "accepted") {
        // For accepted notifications (new connections)
        await FriendRequest.updateMany(
          { _id: { $in: requestIds }, status: 'accepted' },
          { read: true }
        );
      } else {
        // For incoming requests or any other
        await FriendRequest.updateMany(
          { _id: { $in: requestIds } },
          { read: true }
        );
      }
      console.log(`✓ Marked ${requestIds.length} friend notifications as read`);
    } else {
      // Mark all unread notifications for this user
      const result = await FriendRequest.updateMany(
        { 
          $or: [
            { recipient: userId, read: false },
            { sender: userId, status: 'accepted', read: false }
          ]
        },
        { read: true }
      );
      console.log(`✓ Marked all ${result.modifiedCount} friend notifications as read`);
    }

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking friend notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};