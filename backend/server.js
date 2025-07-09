// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import githubRoutes from "./routes/github.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Route files
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import searchRoutes from "./routes/search.routes.js";

const app = express();
const httpServer = createServer(app); // Create HTTP server
const io = new Server(httpServer, { // Initialize Socket.io
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  }
});
const prisma = new PrismaClient();
dotenv.config();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connection", connectionRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/github", githubRoutes);

// Basic Express route
app.get("/", (req, res) => {
  res.json({ message: "Socket.io server is running" });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  socket.on("message", (message) => {
    io.emit('message', `${socket.id.substring(0, 2)} said ${message}`);
  });

  socket.on("disconnect", () => {
    io.emit('message', `${socket.id.substring(0, 2)} disconnected`);
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
