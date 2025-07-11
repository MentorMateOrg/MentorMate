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
const io = new Server(httpServer, {
  // Initialize Socket.io
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
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

// Constants
const SOCKET_ID_SUBSTRING_LENGTH = 2;
const EMPTY_ROOM_SIZE = 0;

// Store active rooms and users
const activeRooms = new Map();
const userRooms = new Map();

// Socket.io connection handling
io.on("connection", (socket) => {
  // Join a coding room
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    userRooms.set(socket.id, { roomId, userId });

    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        code: "// Welcome to collaborative coding!\n// Start typing to see real-time updates",
        language: "javascript",
        users: new Set(),
      });
    }

    const room = activeRooms.get(roomId);
    room.users.add(userId);

    // Send current room state to the joining user
    socket.emit("room-state", {
      code: room.code,
      language: room.language,
      users: Array.from(room.users),
    });

    // Notify others in the room
    socket
      .to(roomId)
      .emit("user-joined", { userId, users: Array.from(room.users) });
  });

  // Handle code changes
  socket.on("code-change", (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update room code
    room.code = data.code;

    // Broadcast to all other users in the room
    socket.to(roomId).emit("code-update", {
      code: data.code,
      userId: data.userId,
    });
  });

  // Handle language changes
  socket.on("language-change", (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update room language
    room.language = data.language;

    // Broadcast to all users in the room
    io.to(roomId).emit("language-update", {
      language: data.language,
      userId: data.userId,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const userRoom = userRooms.get(socket.id);
    if (userRoom) {
      const { roomId, userId } = userRoom;
      const room = activeRooms.get(roomId);

      if (room) {
        room.users.delete(userId);

        // Clean up empty rooms
        if (room.users.size === EMPTY_ROOM_SIZE) {
          activeRooms.delete(roomId);
        } else {
          // Notify remaining users
          socket.to(roomId).emit("user-left", {
            userId,
            users: Array.from(room.users),
          });
        }
      }

      userRooms.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
