import mongoose from "mongoose";

const groupJoinRequestSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  streamChannelId: { type: String, required: true },
  pendingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  approvedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("GroupJoinRequest", groupJoinRequestSchema);
