import mongoose from "mongoose";

const matchingScoreSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  scoreBreakdown: {
    languageCompatibility: Number, // 30%
    availabilityMatch: Number,      // 20%
    goalsAlignment: Number,         // 20%
    experienceLevel: Number,        // 15%
    topicsInterest: Number,         // 10%
    activityLevel: Number           // 5%
  },
  
  reasons: [String], // "Both learning Spanish", "Available evenings"
  
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  
  isValid: {
    type: Boolean,
    default: true
  }
  
}, { timestamps: true });

// Compound index for efficient lookups
matchingScoreSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchingScoreSchema.index({ overallScore: -1 });

const MatchingScore = mongoose.model("MatchingScore", matchingScoreSchema);
export default MatchingScore;