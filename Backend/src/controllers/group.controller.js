import Group from "../models/Group.model.js";
import GroupNotification from "../models/GroupNotification.model.js";
import { 
  createCustomGroupChannel, 
  addMembersToChannel, 
  removeMemberFromChannel,
  deleteChannel,
  updateChannelData
} from "../lib/stream.js";
import User from "../models/User.js";
import { StreamChat } from "stream-chat";
import Activity from "../models/activity.model.js";


// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const creatorId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Generate unique channel ID
    const channelId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create Stream channel
    await createCustomGroupChannel(channelId, { name, image }, creatorId);

    // Create group in database
    const group = await Group.create({
      name,
      description,
      image,
      streamChannelId: channelId,
      createdBy: creatorId,
      admins: [creatorId],
      members: [creatorId],
      pendingRequests: []
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("createdBy", "fullName email profilePic")
      .populate("admins", "fullName email profilePic")
      .populate("members", "fullName email profilePic");

    res.status(201).json({ 
      message: "Group created successfully",
      group: populatedGroup 
    });
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all public groups
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isPublic: true })
      .populate("createdBy", "fullName email profilePic")
      .populate("admins", "fullName email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ groups });
  } catch (error) {
    console.error("Error in getAllGroups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's groups (groups they're a member of)
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("createdBy", "fullName email profilePic")
      .populate("admins", "fullName email profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json({ groups });
  } catch (error) {
    console.error("Error in getUserGroups:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single group details
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("createdBy", "fullName email profilePic")
      .populate("admins", "fullName email profilePic")
      .populate("members", "fullName email profilePic")
      .populate("pendingRequests.userId", "fullName email profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admins.some(admin => admin._id.toString() === userId.toString());
    const isMember = group.members.some(member => member._id.toString() === userId.toString());

    res.status(200).json({ 
      group,
      userRole: {
        isAdmin,
        isMember,
        isCreator: group.createdBy._id.toString() === userId.toString()
      }
    });
  } catch (error) {
    console.error("Error in getGroupDetails:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update group details (admin only)
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, image } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (!group.admins.some(admin => admin.toString() === userId.toString())) {
      return res.status(403).json({ message: "Only admins can update group details" });
    }

    // Update fields
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (image !== undefined) group.image = image.trim();

    await group.save();

    // Update Stream channel data
    try {
      await updateChannelData(group.streamChannelId, {
        name: group.name,
        image: group.image,
      });
    } catch (streamError) {
      console.error("Error updating Stream channel:", streamError);
    }

    const populatedGroup = await Group.findById(group._id)
      .populate("createdBy", "fullName email profilePic")
      .populate("admins", "fullName email profilePic")
      .populate("members", "fullName email profilePic");

    res.status(200).json({ 
      message: "Group updated successfully",
      group: populatedGroup 
    });
  } catch (error) {
    console.error("Error in updateGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request to join group
export const requestJoinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Check if already has pending request
    const hasPendingRequest = group.pendingRequests.some(
      req => req.userId.toString() === userId.toString()
    );

    if (hasPendingRequest) {
      return res.status(400).json({ message: "Request already pending" });
    }

    // Add to pending requests
    group.pendingRequests.push({ userId });
    await group.save();

    res.status(200).json({ message: "Join request sent" });
  } catch (error) {
    console.error("Error in requestJoinGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve join request (admin only)
export const approveJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    console.log("=== APPROVE REQUEST ===");
    console.log("Group ID:", groupId);
    console.log("User ID:", userId);
    console.log("Admin ID:", adminId);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (!group.admins.some(admin => admin.toString() === adminId.toString())) {
      return res.status(403).json({ message: "Only admins can approve requests" });
    }

    // Remove from pending requests
    group.pendingRequests = group.pendingRequests.filter(
      req => req.userId.toString() !== userId
    );

    // Add to members
    if (!group.members.includes(userId)) {
      group.members.push(userId);
    }

    await group.save();
    console.log("✓ User added to group members");

    // Create notification for the user
    try {
      const notification = await GroupNotification.create({
        userId,
        groupId,
        type: "approved",
      });
      console.log("✓ Notification created:", notification);
    } catch (notifError) {
      console.error("✗ Error creating notification:", notifError);
    }

    // Add to Stream channel
    try {
      await addMembersToChannel(group.streamChannelId, [userId]);
      console.log("✓ User added to Stream channel");
    } catch (streamError) {
      console.error("✗ Error adding to Stream channel:", streamError);
    }

    res.status(200).json({ message: "User approved and added to group" });
  } catch (error) {
    console.error("Error in approveJoinRequest:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject join request (admin only)
export const rejectJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (!group.admins.some(admin => admin.toString() === adminId.toString())) {
      return res.status(403).json({ message: "Only admins can reject requests" });
    }

    // Remove from pending requests
    group.pendingRequests = group.pendingRequests.filter(
      req => req.userId.toString() !== userId
    );

    await group.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("Error in rejectJoinRequest:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove member from group (admin only)
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (!group.admins.some(admin => admin.toString() === adminId.toString())) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Can't remove the creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove group creator" });
    }

    // Remove from members and admins
    group.members = group.members.filter(m => m.toString() !== userId);
    group.admins = group.admins.filter(a => a.toString() !== userId);

    await group.save();

    // Remove from Stream channel
    try {
      await removeMemberFromChannel(group.streamChannelId, userId);
    } catch (streamError) {
      console.error("Error removing from Stream channel:", streamError);
    }

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error in removeMember:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Make user admin (creator only)
export const makeAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const creatorId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only creator can make admins
    if (group.createdBy.toString() !== creatorId.toString()) {
      return res.status(403).json({ message: "Only group creator can assign admins" });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member" });
    }

    // Add to admins if not already
    if (!group.admins.includes(userId)) {
      group.admins.push(userId);
      await group.save();
    }

    res.status(200).json({ message: "User promoted to admin" });
  } catch (error) {
    console.error("Error in makeAdmin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Creator cannot leave their own group
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "Group creator cannot leave. Delete the group instead." });
    }

    // Remove from members and admins
    group.members = group.members.filter(m => m.toString() !== userId.toString());
    group.admins = group.admins.filter(a => a.toString() !== userId.toString());

    await group.save();

    // Remove from Stream channel
    try {
      await removeMemberFromChannel(group.streamChannelId, userId.toString());
    } catch (streamError) {
      console.error("Error removing from Stream channel:", streamError);
    }

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete group (creator only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only group creator can delete the group" });
    }

    // Delete Stream channel
    try {
      await deleteChannel(group.streamChannelId);
    } catch (streamError) {
      console.error("Error deleting Stream channel:", streamError);
    }

    // Delete from database
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get group notifications for a user

export async function getGroupNotifications(req, res) {
  try {
    const userId = req.user._id;

    const notifications = await GroupNotification.find({ userId })
      .populate("groupId", "name image")
      .populate("addedBy", "fullName profilePic") // ADDED this
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.log("Error in getGroupNotifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Mark group notifications as read
export const markGroupNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      await GroupNotification.updateMany(
        { _id: { $in: notificationIds }, userId },
        { read: true }
      );
      console.log(`✓ Marked ${notificationIds.length} notifications as read`);
    } else {
      // Mark all as read if no specific IDs provided
      const result = await GroupNotification.updateMany({ userId, read: false }, { read: true });
      console.log(`✓ Marked all ${result.modifiedCount} notifications as read`);
    }

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error in markGroupNotificationsRead:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await GroupNotification.countDocuments({ 
      userId, 
      read: false 
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error in getUnreadNotificationCount:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Add member directly to group (admin only)
 */
export async function addMemberDirectly(req, res) {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if requester is admin or creator
    const isAdmin = group.admins.some(admin => admin.equals(adminId)) || group.creator.equals(adminId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can add members directly" });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (group.members.some(member => member.equals(userId))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add user to group
    group.members.push(userId);
    await group.save();

    // Create notification for the added user
    await GroupNotification.create({
      userId: userId,
      groupId: groupId,
      type: "added_by_admin",
      addedBy: adminId,
      read: false,
    });

    // Add to Stream Chat channel (if you're using Stream)
    try {
      const streamClient = StreamChat.getInstance(
        process.env.STREAM_API_KEY,
        process.env.STREAM_API_SECRET
      );
      const channel = streamClient.channel("messaging", groupId.toString());
      await channel.addMembers([userId.toString()]);
    } catch (streamError) {
      console.log("Error adding member to Stream:", streamError.message);
    }

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      group: await group.populate("members", "fullName profilePic"),
    });
  } catch (error) {
    console.log("Error in addMemberDirectly:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Get friends that can be added to group
 */
export async function getAvailableFriendsForGroup(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Get user's friends
    const user = await User.findById(userId).populate("friends", "fullName profilePic bio nativeLanguages learningLanguages");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out friends who are already members
    const availableFriends = user.friends.filter(
      (friend) => !group.members.some((member) => member.equals(friend._id))
    );

    res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } catch (error) {
    console.log("Error in getAvailableFriendsForGroup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


// Pin a message
export const pinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.some(admin => admin.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Only admins can pin messages" });
    }

    // Add to pinned messages
    group.pinnedMessages.push({
      messageId,
      pinnedBy: userId,
      pinnedAt: new Date()
    });
    await group.save();

    // Log activity
    await Activity.create({
      groupId,
      type: 'message_pinned',
      userId,
      metadata: { messageId }
    });

    res.status(200).json({
      success: true,
      message: "Message pinned successfully"
    });
  } catch (error) {
    console.error("Error in pinMessage:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Unpin a message
export const unpinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isAdmin = group.admins.some(admin => admin.toString() === userId.toString());
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Only admins can unpin messages" });
    }

    // Remove from pinned messages
    group.pinnedMessages = group.pinnedMessages.filter(
      pm => pm.messageId !== messageId
    );
    await group.save();

    await Activity.create({
      groupId,
      type: 'message_unpinned',
      userId,
      metadata: { messageId }
    });

    res.status(200).json({
      success: true,
      message: "Message unpinned successfully"
    });
  } catch (error) {
    console.error("Error in unpinMessage:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get pinned messages
export const getPinnedMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('pinnedMessages.pinnedBy', 'fullName profilePic')
      .lean();

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    res.status(200).json({
      success: true,
      pinnedMessages: group.pinnedMessages || []
    });
  } catch (error) {
    console.error("Error in getPinnedMessages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get group activity
export const getGroupActivity = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 20, offset = 0, type } = req.query;

    const query = { groupId };
    if (type) query.type = type;

    const activities = await Activity.find(query)
      .populate('userId', 'fullName profilePic')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      activities,
      total,
      hasMore: total > parseInt(offset) + activities.length
    });
  } catch (error) {
    console.error("Error in getGroupActivity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Schedule video session
export const scheduleVideoSession = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, date, time, duration, description } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const scheduledFor = new Date(`${date}T${time}`);
    
    const session = {
      id: Date.now().toString(),
      title,
      scheduledFor,
      duration: parseInt(duration),
      description,
      createdBy: userId,
      attendees: [],
      meetingLink: `${process.env.CLIENT_URL}/video-call/${groupId}`,
      createdAt: new Date()
    };

    group.scheduledSessions.push(session);
    await group.save();

    await Activity.create({
      groupId,
      type: 'session_scheduled',
      userId,
      metadata: { sessionId: session.id, title }
    });

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error("Error in scheduleVideoSession:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create poll
export const createPoll = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { question, options, allowMultiple, expiresAt } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const poll = {
      id: Date.now().toString(),
      question,
      options: options.map((opt, index) => ({
        id: `opt_${index}`,
        text: opt,
        votes: []
      })),
      allowMultiple: allowMultiple || false,
      createdBy: userId,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };

    group.polls.push(poll);
    await group.save();

    await Activity.create({
      groupId,
      type: 'poll_created',
      userId,
      metadata: { pollId: poll.id, question }
    });

    res.status(200).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error("Error in createPoll:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Vote on poll
export const votePoll = async (req, res) => {
  try {
    const { groupId, pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const poll = group.polls.find(p => p.id === pollId);
    if (!poll) {
      return res.status(404).json({ success: false, message: "Poll not found" });
    }

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return res.status(400).json({ success: false, message: "Poll has expired" });
    }

    const option = poll.options.find(o => o.id === optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: "Option not found" });
    }

    // Remove previous votes if not allowing multiple
    if (!poll.allowMultiple) {
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => v.toString() !== userId.toString());
      });
    }

    // Add vote
    if (!option.votes.includes(userId)) {
      option.votes.push(userId);
    }

    await group.save();

    res.status(200).json({
      success: true,
      poll
    });
  } catch (error) {
    console.error("Error in votePoll:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Set practice goal
export const setPracticeGoal = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type, metric, target } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const goal = {
      id: Date.now().toString(),
      groupId,
      type,
      metric,
      target: parseInt(target),
      current: 0,
      startDate: new Date(),
      status: 'active'
    };

    if (!user.practiceGoals) {
      user.practiceGoals = [];
    }
    user.practiceGoals.push(goal);
    await user.save();

    res.status(200).json({
      success: true,
      goal
    });
  } catch (error) {
    console.error("Error in setPracticeGoal:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get user profile (enhanced)
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      profile: user
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
