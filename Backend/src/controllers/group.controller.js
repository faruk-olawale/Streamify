import GroupJoinRequest from "../models/GroupJoinRequest.js";
import { addUserToGroup, createGroupChannel } from "../config/stream.js";
import User from "../models/User.js";

// Send join request
export const requestJoinGroup = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await GroupJoinRequest.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: "Request already sent" });

    const request = await GroupJoinRequest.create({ user: userId });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// List pending requests (admins/mods only)
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await GroupJoinRequest.find({ status: "pending" }).populate("user");
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept request (admins/mods only)
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await GroupJoinRequest.findById(requestId).populate("user");
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "accepted";
    await request.save();

    // Add user to Stream group
    await addUserToGroup(request.user._id.toString());

    res.json({ message: "User added to group", user: request.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// List all accepted members
export const getGroupMembers = async (req, res) => {
  try {
    const members = await GroupJoinRequest.find({ status: "accepted" }).populate("user");
    res.json(members.map((m) => m.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
