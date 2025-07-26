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
import todoRoutes from "./routes/todo.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import articleRoutes from "./routes/article.routes.js";
import mentorshipGroupsRoutes from "./routes/mentorship-groups.routes.js";
import groupMembershipRoutes from "./routes/group-membership.routes.js";
import groupPostsRoutes from "./routes/group-posts.routes.js";
import generateDeltas from "./utils/delta.js";
import { transformOp } from "./utils/transform.js";
import { applyOperations } from "./utils/applyOps.js";
import {
  getOperationChain,
  getVersionHistory,
  findCommonAncestor,
} from "./utils/versionUtils.js";

// Function to reconstruct a version from operations
const reconstructVersion = async (roomId, versionId) => {
  if (!versionId) {
    return DEFAULT_CODE_TEMPLATE;
  }

  try {
    // First, find the room by roomId string
    const room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    // Get all versions for this room using the integer room ID
    const versions = await prisma.codeChange.findMany({
      where: { roomId: room.id },
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

// Note: We're now using the imported applyOperations function from utils/applyOps.js

const app = express();
const httpServer = createServer(app); // Create HTTP server

// CORS origins for both development and production
const allowedOrigins = [
  "http://localhost:5173", // Vite development server
  "http://localhost:3000", // React development server
  process.env.FRONTEND_URL || "https://mentormate-frontend.onrender.com",
];

const io = new Server(httpServer, {
  // Initialize Socket.io
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const prisma = new PrismaClient();
dotenv.config();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/mentorship-groups", mentorshipGroupsRoutes);
app.use("/api/group-membership", groupMembershipRoutes);
app.use("/api/group-posts", groupPostsRoutes);

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

  // Handle code changes with OT
  socket.on("code-change", async (data) => {
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    const { roomId, userId } = userRoom;
    const room = activeRooms.get(roomId);
    if (!room) return;

    try {
      const oldText = room.code;
      const newText = data.code;

      // Generate operations from client's changes
      const clientOps = generateDeltas(oldText, newText);

      // Apply operations directly to room state
      room.code = applyOperations(oldText, clientOps);
      updateRoomActivity(roomId);

      const versionId = crypto.randomUUID();

      // Ensure the room exists in DB before creating code change
      await prisma.room.upsert({
        where: { roomId },
        update: {},
        create: {
          roomId,
          title: `Room ${roomId}`,
          createdById: parseInt(userId),
        },
      });

      // Get the room's integer ID for the foreign key relationship
      const roomRecord = await prisma.room.findUnique({
        where: { roomId: roomId },
        select: { id: true },
      });

      if (!roomRecord) {
        throw new Error(`Room with roomId ${roomId} not found`);
      }

      // Store the operation in the database
      await prisma.codeChange.create({
        data: {
          roomId: roomRecord.id,
          userId: parseInt(userId),
          versionId,
          parentId: room.lastVersionId || undefined,
          operations: clientOps,
        },
      });

      room.lastVersionId = versionId;

      // Save room session
      try {
        await prisma.roomSession.create({
          data: {
            room: {
              connect: { roomId },
            },
            user: {
              connect: { id: parseInt(userId) },
            },
            code: room.code,
            language: room.language,
          },
        });
      } catch (error) {
        throw new Error("Failed to save room session");
      }

      // Broadcast to all other users in the room
      socket.to(roomId).emit("code-update", {
        code: room.code,
        userId,
        operations: clientOps,
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to process code change" });
    }
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

      // Ensure the room exists in DB before creating code change
      await prisma.room.upsert({
        where: { roomId },
        update: {},
        create: {
          roomId,
          title: `Room ${roomId}`,
          createdById: parseInt(userId),
        },
      });

      // Get the room's integer ID for the foreign key relationship
      const roomRecord = await prisma.room.findUnique({
        where: { roomId: roomId },
        select: { id: true },
      });

      if (!roomRecord) {
        throw new Error(`Room with roomId ${roomId} not found`);
      }

      await prisma.codeChange.create({
        data: {
          roomId: roomRecord.id, // Use the integer ID for the foreign key
          userId: parseInt(userId),
          versionId,
          parentId: room.lastVersionId || undefined,
          operations: operations,
          isSavedVersion: true, // Mark this as a saved version
        },
      });

      // Update room state
      room.lastVersionId = versionId;

      // Emit an event to notify clients that a version was saved
      io.to(roomId).emit("version-saved", {
        versionId,
        userId,
        userName: userRoom.fullName || "Anonymous",
      });
    } catch (err) {
      socket.emit("error", {
        message: "Failed to save version",
        error: err.message,
      });
    }
  });

  // Get version history with operations
  socket.on("get-version-history", async (roomId) => {
    try {
      const versions = await getVersionHistory(roomId);
      socket.emit("version-history", { versions });
    } catch (error) {
      socket.emit("error", {
        message: "Failed to fetch version history",
        error: error.message,
      });
    }
  });

  // Get version changes for preview
  socket.on("get-version-changes", async (data) => {
    const { roomId, versionId } = data;

    try {
      // Get the room's numeric id using the roomId string
      const roomData = await prisma.room.findUnique({
        where: { roomId },
        select: { id: true },
      });

      if (!roomData) {
        throw new Error(`Room with roomId ${roomId} not found`);
      }

      // Get the version to preview
      const version = await prisma.codeChange.findFirst({
        where: { roomId: roomData.id, versionId },
        include: { user: { include: { profile: true } } },
      });

      if (!version) {
        socket.emit("error", { message: "Version not found" });
        return;
      }

      // Get the current room state
      const room = activeRooms.get(roomId);
      const currentCode = room ? room.code : DEFAULT_CODE_TEMPLATE;

      // Reconstruct the code that would result from applying this version
      const versionCode = await reconstructVersion(roomId, versionId);

      socket.emit("version-changes", {
        versionId,
        operations: version.operations,
        currentCode,
        versionCode,
        author: version.user?.profile?.full_name || "Unknown User",
        timestamp: version.timestamp,
      });
    } catch (error) {
      socket.emit("error", {
        message: "Failed to get version changes",
        error: error.message,
      });
    }
  });

  // Apply a specific version
  socket.on("apply-version", async (data) => {
    const { roomId, versionId } = data;
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    try {
      // Get the room's numeric id using the roomId string
      const roomData = await prisma.room.findUnique({
        where: { roomId },
        select: { id: true },
      });

      if (!roomData) {
        throw new Error(`Room with roomId ${roomId} not found`);
      }

      // Get the version to apply
      const version = await prisma.codeChange.findFirst({
        where: { roomId: roomData.id, versionId },
      });

      if (!version) {
        socket.emit("error", { message: "Version not found" });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Reconstruct the code by applying all operations up to this version
      const reconstructedCode = await reconstructVersion(roomId, versionId);

      // Update room state
      room.code = reconstructedCode;
      room.lastVersionId = versionId;

      // Broadcast the reconstructed code to all users in the room
      io.to(roomId).emit("code-update", {
        code: reconstructedCode,
        userId: userRoom.userId,
        versionId,
      });

      socket.emit("version-applied", { versionId });
    } catch (error) {
      socket.emit("error", {
        message: "Failed to apply version",
        error: error.message,
      });
    }
  });

  // This is a duplicate handler and has been removed

  // Handle conflict resolution between two versions
  socket.on("resolve-conflict", async (data) => {
    const { roomId, version1Id, version2Id } = data;
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    try {
      // Find the common ancestor of the two versions
      const commonAncestorId = await findCommonAncestor(
        version1Id,
        version2Id,
        roomId
      );

      if (!commonAncestorId) {
        socket.emit("error", { message: "No common ancestor found" });
        return;
      }

      // Get operations from common ancestor to version1
      const ops1 = await getOperationChain(
        commonAncestorId,
        version1Id,
        roomId
      );

      // Get operations from common ancestor to version2
      const ops2 = await getOperationChain(
        commonAncestorId,
        version2Id,
        roomId
      );

      // Transform ops2 against ops1
      const transformedOps2 = transformOp(ops2.operations, ops1.operations);

      // Get the room
      const room = activeRooms.get(roomId);
      if (!room) return;

      // Apply transformed operations to version1's code
      const baseCode = applyOperations("", ops1.operations); // Start with empty string and apply ops1
      const mergedCode = applyOperations(baseCode, transformedOps2);

      // Update room code
      room.code = mergedCode;

      // Create a new version for the merged code
      const mergedVersionId = crypto.randomUUID();

      // Ensure the room exists in DB before creating code change
      await prisma.room.upsert({
        where: { roomId },
        update: {},
        create: {
          roomId,
          title: `Room ${roomId}`,
          createdById: parseInt(userRoom.userId),
        },
      });

      // Get the room's integer ID for the foreign key relationship
      const roomRecord = await prisma.room.findUnique({
        where: { roomId: roomId },
        select: { id: true },
      });

      if (!roomRecord) {
        throw new Error(`Room with roomId ${roomId} not found`);
      }

      // Save the merged version
      await prisma.codeChange.create({
        data: {
          roomId: roomRecord.id, // Use the integer ID for the foreign key
          userId: parseInt(userRoom.userId),
          versionId: mergedVersionId,
          parentId: version1Id, // Use version1 as parent
          operations: transformedOps2,
        },
      });

      room.lastVersionId = mergedVersionId;

      // Broadcast the merged code to all users
      io.to(roomId).emit("code-update", {
        code: mergedCode,
        userId: userRoom.userId,
        versionId: mergedVersionId,
      });

      socket.emit("conflict-resolved", {
        versionId: mergedVersionId,
        message: "Conflict resolved successfully",
      });
    } catch (error) {
      socket.emit("error", {
        message: "Failed to resolve conflict",
        error: error.message,
      });
    }
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
