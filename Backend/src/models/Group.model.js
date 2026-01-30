import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      default: ""
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
    streamChannelId: {
      type: String,
      required: true
    },
    
    // NEW FIELDS FOR ENHANCED FEATURES
    pinnedMessages: [{
      messageId: String,
      pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      pinnedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    scheduledSessions: [{
      id: String,
      title: String,
      scheduledFor: Date,
      duration: Number,
      description: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }],
      meetingLink: String,
      status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    polls: [{
      id: String,
      question: String,
      options: [{
        id: String,
        text: String,
        votes: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }]
      }],
      allowMultiple: {
        type: Boolean,
        default: false
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date,
      status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
      }
    }],
    
    settings: {
      allowVoiceMessages: {
        type: Boolean,
        default: true
      },
      allowPolls: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

// Indexes
groupSchema.index({ 'pinnedMessages.messageId': 1 });
groupSchema.index({ 'scheduledSessions.scheduledFor': 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;