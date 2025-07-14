// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import githubRoutes from "./routes/github.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";


// Route files
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import searchRoutes from "./routes/search.routes.js";
import { parse } from "path";

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
const MAX_ROOM_CAPACITY = 10;
const ROOM_INACTIVITY_TIMEOUT = 3600000; // 1 hour in milliseconds
const DEFAULT_LANGUAGE = "javascript";

// Store active rooms and users
const activeRooms = new Map();
const userRooms = new Map();

// Room management utilities
const createRoom = (roomId) => {
  return {
    code: "// Welcome to collaborative coding!\n// Start typing to see real-time updates",
    language: DEFAULT_LANGUAGE,
    users: new Set(),
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true,
  };
};

const validateRoomAccess = (roomId, userId) => {
  if (!roomId || !userId) {
    return { valid: false, error: "Room ID and User ID are required" };
  }

  if (typeof roomId !== "string" || typeof userId !== "string") {
    return { valid: false, error: "Room ID and User ID must be strings" };
  }

  const room = activeRooms.get(roomId);
  if (room && room.users.size >= MAX_ROOM_CAPACITY) {
    return { valid: false, error: "Room is at maximum capacity" };
  }

  return { valid: true };
};

const updateRoomActivity = (roomId) => {
  const room = activeRooms.get(roomId);
  if (room) {
    room.lastActivity = new Date();
  }
};

const cleanupInactiveRooms = () => {
  const now = new Date();
  for (const [roomId, room] of activeRooms.entries()) {
    const timeSinceLastActivity = now - room.lastActivity;
    if (
      timeSinceLastActivity > ROOM_INACTIVITY_TIMEOUT &&
      room.users.size === EMPTY_ROOM_SIZE
    ) {
      activeRooms.delete(roomId);
    }
  }
};

// Cleanup inactive rooms every 30 minutes
const CLEANUP_INTERVAL = 1800000; // 30 minutes
setInterval(cleanupInactiveRooms, CLEANUP_INTERVAL);

// Socket.io connection handling
io.on("connection", (socket) => {
  // Join a coding room
  socket.on("join-room", async (roomId, token) => {
    try{
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userId = decoded.userId;

    const validation = validateRoomAccess(roomId, userId.toString());
    if (!validation.valid) {
      socket.emit("room-error", { error: validation.error });
      return;
    }


    socket.join(roomId);
    userRooms.set(socket.id, { roomId, userId: userId.toString() });

    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, createRoom(roomId));
    }
await prisma.room.create({
  data: {
    roomId,
    title: `Room ${roomId}`,
    createdById: userId
  }
})

    const room = activeRooms.get(roomId);
    room.users.add(userId.toString());
    updateRoomActivity(roomId);

    // Send current room state to the joining user
    socket.emit("room-state", {
      code: room.code,
      language: room.language,
      users: Array.from(room.users),
      roomInfo: {
        createdAt: room.createdAt,
        userCount: room.users.size,
        maxCapacity: MAX_ROOM_CAPACITY,
      },
    });

    // Notify others in the room
    socket.to(roomId).emit("user-joined", {
      userId,
      users: Array.from(room.users),
      userCount: room.users.size,
    });
  } catch (error) {
    socket.emit("room-error", { error: "Invalid token" });
  }
  });

  // Handle code changes
  socket.on("code-change", async (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId, userId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update room code and activity
    room.code = data.code;
    updateRoomActivity(roomId);

await prisma.roomSession.create({
  data: {
    room: {
      connect: {roomId},

    },
    user: {
      connect: {id: parseInt(userId)},
    },
    code: data.code,
    language: room.language,
  },
})

    // Broadcast to all other users in the room
    socket.to(roomId).emit("code-update", {
      code: data.code,
      userId,
    });
  });

  // Handle language changes
  socket.on("language-change", (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update room language and activity
    room.language = data.language;
    updateRoomActivity(roomId);

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
        updateRoomActivity(roomId);

        // Clean up empty rooms
        if (room.users.size === EMPTY_ROOM_SIZE) {
          activeRooms.delete(roomId);
        } else {
          // Notify remaining users
          socket.to(roomId).emit("user-left", {
            userId,
            users: Array.from(room.users),
            userCount: room.users.size,
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
