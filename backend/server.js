// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import githubRoutes from "./routes/github.routes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Route files
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import userRoutes from "./routes/user.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import searchRoutes from "./routes/search.routes.js";
import roomRoutes from "./routes/room.routes.js";
import generateDeltas from "./utils/delta.js";

// Function to reconstruct a version from operations
const reconstructVersion = async (roomId, versionId) => {
  if (!versionId) {
    return DEFAULT_CODE_TEMPLATE;
  }

  try {
    // Get all versions for this room
    const versions = await prisma.codeChange.findMany({
      where: { roomId: roomId },
      orderBy: { timestamp: "asc" },
    });

    // Build the chain from root to the target version
    const versionChain = [];
    let current = versions.find((v) => v.versionId === versionId);

    while (current) {
      versionChain.unshift(current);
      current = versions.find((v) => v.versionId === current.parentId);
    }

    // Start with the base template and apply operations in chronological order
    let code = DEFAULT_CODE_TEMPLATE;
    for (const change of versionChain) {
      code = applyOperations(code, change.operations);
    }

    return code;
  } catch (error) {
    return DEFAULT_CODE_TEMPLATE;
  }
};

// Function to apply operations to code
const applyOperations = (baseCode, operations) => {
  const DELETE = "delete";
  const INSERT = "insert";
  let result = baseCode;

  for (const op of operations) {
    if (op.type === DELETE) {
      result = result.slice(0, op.pos) + result.slice(op.pos + op.length);
    } else if (op.type === INSERT) {
      result = result.slice(0, op.pos) + op.text + result.slice(op.pos);
    }
  }
  return result;
};

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
app.use("/api/rooms", roomRoutes);

// Basic Express route
app.get("/", (req, res) => {
  res.json({ message: "Socket.io server is running" });
});

// Constants
const EMPTY_ROOM_SIZE = 0;
const MAX_ROOM_CAPACITY = 10;
const ROOM_INACTIVITY_TIMEOUT = 3600000; // 1 hour in milliseconds
const DEFAULT_LANGUAGE = "javascript";
const DEFAULT_CODE_TEMPLATE =
  "// Welcome to collaborative coding!\n// Start typing to see real-time updates";

// Store active rooms and users
const activeRooms = new Map();
const userRooms = new Map();

// Room management utilities
const createRoom = (roomId) => {
  return {
    code: DEFAULT_CODE_TEMPLATE,
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
  socket.on("join-room", async (roomId, token, fullName) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id.toString();

      const validation = validateRoomAccess(roomId, userId);
      if (!validation.valid) {
        socket.emit("room-error", { error: validation.error });
        return;
      }

      // Ensure the room exists in memory
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, createRoom(roomId));
      }

      // Make sure the room exists in DB (handle race condition)
      await prisma.room.upsert({
        where: { roomId },
        update: {},
        create: {
          roomId,
          title: `Room ${roomId}`,
          createdById: parseInt(userId),
        },
      });

      const room = activeRooms.get(roomId);
      socket.join(roomId);

      // Store user info object instead of just userId
      const userInfo = { userId, fullName };
      room.users.add(userInfo);
      userRooms.set(socket.id, { roomId, userId, fullName });

      updateRoomActivity(roomId);

      // Get array of fullNames for display
      const userNames = Array.from(room.users).map((user) => user.fullName);

      // Emit current state to this user
      socket.emit("room-state", {
        code: room.code,
        language: room.language,
        users: userNames,
        roomInfo: {
          createdAt: room.createdAt,
          userCount: room.users.size,
          maxCapacity: MAX_ROOM_CAPACITY,
        },
      });

      // Notify others
      socket.to(roomId).emit("user-joined", {
        fullName,
        users: userNames,
        userCount: room.users.size,
      });
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        socket.emit("room-error", { error: "Invalid token" });
      } else {
        socket.emit("room-error", { error: "Internal server error" });
      }
    }
  });

  // Handle code changes (real-time collaboration, no version saving)
  socket.on("code-change", async (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId, userId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update room code and activity
    room.code = data.code;
    updateRoomActivity(roomId);

    const versionId = crypto.randomUUID();
try{
    await prisma.codeChange.create({
      data: {
        roomId: parseInt(roomId),
        userId: parseInt(userId),
        versionId,
        parentId: room.lastVersionId || null,
        operations,
      },
    });

    room.lastVersionId = versionId;

    await prisma.roomSession.create({
      data: {
        room: {
          connect: { roomId },
        },
      }});

      room.lastVersionId = versionId;

      await prisma.roomSession.create({
        data: {
          room: {
            connect: { roomId },
          },
          user: {
            connect: { id: parseInt(userId) },

          },
        },
      });
    } catch (error) {
      //will handle error later
    }
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

  socket.on("save-version", async (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId, userId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    const versionId = crypto.randomUUID();

    try {
      // Reconstruct the parent version to use as base for comparison
      const baseCode = await reconstructVersion(roomId, room.lastVersionId);

      // Generate operations from the base code to the new code
      const operations = generateDeltas(baseCode, data.code);

      await prisma.codeChange.create({
        data: {
          roomId: roomId,
          userId: parseInt(userId),
          versionId,
          parentId: room.lastVersionId || null,
          operations,
        },
      });

      // Update room state
      room.lastVersionId = versionId;
      room.code = data.code; // Update room code to the saved version

      // Get user info for the notification
      const userRoom = userRooms.get(socket.id);
      const userInfo = userRoom ? userRoom.fullName : "Unknown User";

      // Notify all users in the room that a version was saved
      io.to(roomId).emit("version-saved", {
        versionId,
        userId,
        userName: userInfo,
        message: `New version saved by ${userInfo}`,
      });
    } catch (err) {}
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId, userId } = userRoom;
    const room = activeRooms.get(roomId);

    if (room) {
      // Find and remove the user object from the Set
      const userToRemove = Array.from(room.users).find(
        (user) => user.userId === userId
      );
      if (userToRemove) {
        room.users.delete(userToRemove);
      }
      updateRoomActivity(roomId);

      if (room.users.size === EMPTY_ROOM_SIZE) {
        activeRooms.delete(roomId);
      } else {
        // Get array of fullNames for display
        const userNames = Array.from(room.users).map((user) => user.fullName);
        socket.to(roomId).emit("user-left", {
          userId,
          users: userNames,
          userCount: room.users.size,
        });
      }
    }

    userRooms.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
