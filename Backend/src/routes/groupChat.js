import express from "express";
import { createGroupChannel, addUserToGroup } from "../lib/stream.js";
import GroupJoinRequest from "../models/GroupJoinRequest.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * 1️⃣ Initialize global group (run once)
 */
router.post("/init", async (req, res) => {
  try {
    // Check if the channel already exists in DB
    const existing = await GroupJoinRequest.findOne({ groupName: "global-chat" });
    if (existing) return res.json({ success: true, message: "Global chat already initialized" });

    const channel = await createGroupChannel();

    // Store in DB for reference
    const groupRecord = new GroupJoinRequest({
      groupName: "global-chat",
      streamChannelId: channel.id,
      pendingUsers: [],
      approvedUsers: [],
    });
    await groupRecord.save();

    return res.json({ success: true, channel });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create group channel" });
  }
});

/**
 * 2️⃣ User requests to join the group
 */
router.post("/request-join", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const group = await GroupJoinRequest.findOne({ groupName: "global-chat" });
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Avoid duplicates
    if (!group.pendingUsers.includes(userId) && !group.approvedUsers.includes(userId)) {
      group.pendingUsers.push(userId);
      await group.save();
    }

    return res.json({ success: true, pendingUsers: group.pendingUsers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to request join" });
  }
});

/**
 * 3️⃣ Admin approves a user
 */
router.post("/approve", async (req, res) => {
  const { adminId, userId } = req.body;
  if (!adminId || !userId) return res.status(400).json({ error: "Missing adminId or userId" });

  try {
    // Check admin role
    const adminUser = await User.findById(adminId);
    if (!adminUser || !["admin", "moderator"].includes(adminUser.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const group = await GroupJoinRequest.findOne({ groupName: "global-chat" });
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.pendingUsers.includes(userId)) {
      return res.status(400).json({ error: "User has not requested to join" });
    }

    // Add user to Stream group
    await addUserToGroup(userId);

    // Move from pending to approved
    group.pendingUsers = group.pendingUsers.filter((u) => u !== userId);
    group.approvedUsers.push(userId);
    await group.save();

    return res.json({
      success: true,
      approvedUsers: group.approvedUsers,
      pendingUsers: group.pendingUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to approve user" });
  }
});

/**
 * 4️⃣ Get pending and approved users
 */
router.get("/status", async (req, res) => {
  try {
    const group = await GroupJoinRequest.findOne({ groupName: "global-chat" });
    if (!group) return res.status(404).json({ error: "Group not found" });

    return res.json({
      pendingUsers: group.pendingUsers,
      approvedUsers: group.approvedUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get status" });
  }
});

export default router;
