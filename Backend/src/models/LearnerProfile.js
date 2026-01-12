
import mongoose from "mongoose";

const learnerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  
  // Language Learning Details
  languages: [{
    language: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['native', 'learning', 'teaching'],
      required: true,
    },
    proficiencyLevel: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'],
    },
    yearsLearning: Number,
    certifications: [String],
  }],
  
  // Learning Goals & Preferences
  learningGoals: [{
    type: String,
    enum: [
      'Conversation',
      'Pronunciation', 
      'Grammar',
      'Writing',
      'Reading',
      'Listening',
      'Business',
      'Travel',
      'Academic',
      'Casual'
    ]
  }],
  
  preferredTopics: [String], // "Technology", "Sports", "Music"
  
  // Availability
  timezone: String,
  availableSlots: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    timeSlots: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Night']
    }]
  }],
  
  // Learning Style & Preferences
  learningStyle: {
    type: String,
    enum: ['Visual', 'Auditory', 'Kinesthetic', 'Mixed']
  },
  
  sessionPreferences: {
    preferredDuration: {
      type: Number, // in minutes
      default: 30
    },
    preferredFrequency: {
      type: String,
      enum: ['Daily', 'Few times a week', 'Weekly', 'Bi-weekly', 'Flexible']
    },
    sessionType: [{
      type: String,
      enum: ['Video', 'Voice', 'Text', 'Mixed']
    }]
  },
  
  // Matching Preferences
  matchingPreferences: {
    ageRange: {
      min: Number,
      max: Number
    },
    genderPreference: {
      type: String,
      enum: ['Any', 'Male', 'Female', 'Non-binary']
    },
    experienceLevel: [{
      type: String,
      enum: ['Beginner-friendly', 'Intermediate', 'Advanced', 'Any']
    }],
    maxDistance: Number, // km, for location-based matching
  },
  
  // Profile Completion Status
  profileCompleteness: {
    type: Number,
    default: 0, // 0-100
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
}, { timestamps: true });

// Calculate profile completeness
learnerProfileSchema.methods.calculateCompleteness = function() {
  let score = 0;
  if (this.languages.length > 0) score += 20;
  if (this.learningGoals.length > 0) score += 15;
  if (this.availableSlots.length > 0) score += 15;
  if (this.preferredTopics.length > 0) score += 10;
  if (this.timezone) score += 10;
  if (this.learningStyle) score += 10;
  if (this.sessionPreferences.preferredDuration) score += 10;
  if (this.sessionPreferences.sessionType.length > 0) score += 10;
  
  this.profileCompleteness = score;
  return score;
};

const LearnerProfile = mongoose.model("LearnerProfile", learnerProfileSchema);
export default LearnerProfile;