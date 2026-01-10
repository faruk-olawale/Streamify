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
    // FIXED: Changed from String to Array of Strings
    nativeLanguages: { 
        type: [String],  // Array of strings
        default: []      // Empty array instead of "English"
    },
    
    // FIXED: Changed from String to Array of Strings
    learningLanguages: {
        type: [String],  // Array of strings
        default: []      // Empty array
    },

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
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;