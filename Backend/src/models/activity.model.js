import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'member_joined',
      'member_left',
      'message_pinned',
      'message_unpinned',
      'group_updated',
      'practice_session',
      'members_milestone',
      'achievement',
      'poll_created',
      'session_scheduled'
    ],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activitySchema.index({ groupId: 1, timestamp: -1 });
activitySchema.index({ groupId: 1, type: 1, timestamp: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;