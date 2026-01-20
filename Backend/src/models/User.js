import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true, 
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 6,
    },
    bio:{
        type: String,
        default: "",
    },
    profilePic:{
        type: String,
        default: "",
    },
    nativeLanguages: { 
        type: [String],
        default: []
    },
    
    learningLanguages: {
        type: [String],
        default: []
    },

    // ENHANCED: Proficiency levels for each language
    proficiencyLevels: {
        type: Map,
        of: {
            level: { 
                type: String, 
                enum: ['beginner', 'intermediate', 'advanced', 'native'],
                required: true
            },
            startedLearning: { 
                type: Date, 
                default: Date.now 
            }
        },
        default: new Map()
    },

    // ENHANCED: Detailed learning goals per language
    learningGoals: [{
        language: {
            type: String,
            required: true
        },
        goals: [{
            type: String,
            enum: [
                'Travel', 
                'Business', 
                'Academic', 
                'Casual Conversation',
                'Exam Preparation',
                'Cultural Interest',
                'Career Development',
                'Making Friends'
            ]
        }],
        priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium'
        }
    }],
    
    availability: [{
        type: String,
    }],

    location:{
        type: String,
        default: "",
    },

    // NEW: User preferences for matching
    matchPreferences: {
        similarLevel: { type: Boolean, default: true },
        goalAlignment: { type: Boolean, default: true },
        activeUsersOnly: { type: Boolean, default: false }
    },

    // NEW: Track user activity for matching
    lastActive: { 
        type: Date, 
        default: Date.now,
        index: true
    },

    isOnboarded:{
        type: Boolean,
        default: false,
    },
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ]

}, {timestamps: true});

// pre hook - MUST come BEFORE mongoose.model()
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActive on every save
userSchema.pre("save", function (next) {
  this.lastActive = new Date();
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    console.error("❌ User has no password field:", this.email);
    return false;
  }
  
  if (!enteredPassword) {
    console.error("❌ No password provided for comparison");
    return false;
  }
  
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;