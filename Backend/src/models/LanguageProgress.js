import mongoose from "mongoose";

const languageProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  language: {
    type: String,
    required: true
  },
  
  currentLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    default: 'A1'
  },
  
  startDate: {
    type: Date,
    default: Date.now
  },
  
  // Statistics
  stats: {
    totalSessionsCompleted: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastSessionDate: Date,
  },
  
  // Skills Breakdown
  skills: {
    speaking: {
      level: { type: Number, default: 0, max: 100 },
      sessionsCount: { type: Number, default: 0 }
    },
    listening: {
      level: { type: Number, default: 0, max: 100 },
      sessionsCount: { type: Number, default: 0 }
    },
    reading: {
      level: { type: Number, default: 0, max: 100 },
      sessionsCount: { type: Number, default: 0 }
    },
    writing: {
      level: { type: Number, default: 0, max: 100 },
      sessionsCount: { type: Number, default: 0 }
    },
    grammar: {
      level: { type: Number, default: 0, max: 100 },
      sessionsCount: { type: Number, default: 0 }
    },
    vocabulary: {
      level: { type: Number, default: 0, max: 100 },
      wordsKnown: { type: Number, default: 0 }
    }
  },
  
  // Milestones
  milestones: [{
    title: String,
    description: String,
    achievedDate: Date,
    type: {
      type: String,
      enum: ['Session', 'Streak', 'Hours', 'Level', 'Skills']
    }
  }],
  
  // Goals
  goals: [{
    description: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Abandoned'],
      default: 'Active'
    },
    progress: {
      type: Number,
      default: 0,
      max: 100
    }
  }],
  
}, { timestamps: true });

// Update streak logic
languageProgressSchema.methods.updateStreak = function() {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastSession = this.stats.lastSessionDate ? 
    new Date(this.stats.lastSessionDate).setHours(0, 0, 0, 0) : null;
  
  if (!lastSession) {
    this.stats.currentStreak = 1;
  } else {
    const daysDiff = Math.floor((today - lastSession) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, don't change streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      this.stats.currentStreak += 1;
      if (this.stats.currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = this.stats.currentStreak;
      }
    } else {
      // Streak broken
      this.stats.currentStreak = 1;
    }
  }
  
  this.stats.lastSessionDate = new Date();
};

const LanguageProgress = mongoose.model("LanguageProgress", languageProgressSchema);
export default LanguageProgress;