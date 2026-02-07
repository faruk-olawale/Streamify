// Backend/models/Poll.model.js
import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String, // Just store user ID as string for simplicity
    required: true
  },
  options: [{
    id: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    votes: {
      type: Number,
      default: 0
    },
    voters: [{
      userId: String,
      userName: String,
      userImage: String,
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  settings: {
    allowMultiple: {
      type: Boolean,
      default: false
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
pollSchema.index({ channelId: 1, createdAt: -1 });

// Virtual for total votes
pollSchema.virtual('totalVotes').get(function() {
  return this.options.reduce((sum, opt) => sum + opt.votes, 0);
});

// Method to check if user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  return this.options.some(opt => 
    opt.voters.some(voter => voter.userId === userId || voter.userId?.toString() === userId?.toString())
  );
};

// Method to get user's voted options
pollSchema.methods.getUserVotes = function(userId) {
  return this.options
    .filter(opt => opt.voters.some(voter => 
      voter.userId === userId || voter.userId?.toString() === userId?.toString()
    ))
    .map(opt => opt.id);
};

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;