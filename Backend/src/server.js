import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";
import uploadRoutes from "./routes/upload.route.js";
import matchingRoutes from "./routes/matching.route.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import pollRoutes from "./routes/poll.route.js";
import aiRoutes from './routes/ai.route.js';
import os from "os";



import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);  // Keep only this one
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/matching", matchingRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/polls", pollRoutes);
app.use('/api/ai', aiRoutes);

// Log all registered routes
console.log("=== REGISTERED ROUTES ===");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.path);
  }
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../Frontend/dist")));

    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../Frontend", "dist", "index.html"));
    });
}

app.get("/api/server-ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  let lanIp = "localhost";

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        lanIp = iface.address;
        break;
      }
    }
  }

  res.json({ ip: lanIp, port: process.env.PORT || 5001 });
});
console.log('🔑 Groq API Key:', process.env.GROQ_API_KEY ? 'Loaded ✅' : 'Missing ❌');


app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    connectDB();
});