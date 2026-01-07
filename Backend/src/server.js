import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";


import { connectDB } from "./lib/db.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT

const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);


if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../Frontend/dist")));

    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../Frontend", "dist", "index.html"));
    })
}

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    connectDB();
    
})