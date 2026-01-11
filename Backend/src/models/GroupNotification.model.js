import mongoose from "mongoose";

const groupNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
    type: {
      type: String,
      enum: ["approved", "rejected", "removed", "added_by_admin"], // Added new type
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const GroupNotification = mongoose.model("GroupNotification", groupNotificationSchema);

export default GroupNotification;