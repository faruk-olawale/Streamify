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

    matchPreferences: {
        similarLevel: { type: Boolean, default: true },
        goalAlignment: { type: Boolean, default: true },
        activeUsersOnly: { type: Boolean, default: false }
    },

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
    ],

    practiceHistory: [{
        date: { type: Date, required: true },
        minutesPracticed: { type: Number, default: 0 },
        activities: [{
            type: { type: String, enum: ['chat', 'video', 'group'] },
            partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            duration: Number,
            timestamp: { type: Date, default: Date.now }
        }]
    }],
    
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastPracticeDate: { type: Date },
    
    dailyGoal: { type: Number, default: 30 },
    todaysPracticeMinutes: { type: Number, default: 0 },

    // ============================================
    // NEW FIELDS - ADD THESE
    // ============================================
    
    practiceSchedule: {
        type: String,
        maxlength: 200,
        default: ""
    },

    practiceGoals: [{
        id: String,
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group"
        },
        type: {
            type: String,
            enum: ['daily', 'weekly', 'monthly']
        },
        metric: {
            type: String,
            enum: ['messages', 'minutes', 'sessions']
        },
        target: Number,
        current: {
            type: Number,
            default: 0
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        status: {
            type: String,
            enum: ['active', 'completed', 'failed'],
            default: 'active'
        }
    }],

    status: {
        type: String,
        enum: ['available', 'busy', 'dnd', 'away', 'offline'],
        default: 'available'
    },

    statusMessage: {
        type: String,
        maxlength: 100,
        default: ""
    },

    achievements: [{
        id: String,
        name: String,
        description: String,
        icon: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],

    stats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalPracticeMinutes: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        },
        joinedGroupsCount: {
            type: Number,
            default: 0
        }
    }

}, {timestamps: true});

// Keep all your existing pre-hooks and methods...
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

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