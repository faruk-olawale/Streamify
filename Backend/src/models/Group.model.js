import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/150?text=Group"
  },
  streamChannelId: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  pendingRequests: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;