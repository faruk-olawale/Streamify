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

    // NEW FIELDS
    learningGoals: [{
        type: String,
    }],
    
    availability: [{
        type: String,
    }],

    location:{
        type: String,
        default: "",
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

// FIXED: Add error handling for undefined password
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