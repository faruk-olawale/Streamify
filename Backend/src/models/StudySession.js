
import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ['learner', 'teacher', 'peer']
    }
  }],
  
  language: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['Practice', 'Teaching', 'Casual', 'Structured'],
    required: true
  },
  
  duration: {
    type: Number, // in minutes
    required: true
  },
  
  sessionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  focusAreas: [{
    type: String,
    enum: ['Conversation', 'Pronunciation', 'Grammar', 'Writing', 'Reading', 'Listening']
  }],
  
  topics: [String],
  
  // Feedback & Rating
  feedback: [{
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    skills: {
      speaking: Number,
      listening: Number,
      grammar: Number,
      vocabulary: Number
    }
  }],
  
  // Session Outcomes
  outcomes: {
    wordsLearned: [String],
    mistakesCorrected: Number,
    goalsAchieved: [String]
  },
  
  notes: String,
  
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No-show'],
    default: 'Scheduled'
  },
  
}, { timestamps: true });

// Index for queries
studySessionSchema.index({ participants: 1, sessionDate: -1 });
studySessionSchema.index({ language: 1, status: 1 });

const StudySession = mongoose.model("StudySession", studySessionSchema);
export default StudySession;