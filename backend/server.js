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
import { parse } from "path";
import roomRoutes from "./routes/room.routes.js";
import generateDeltas from "./utils/delta.js";
import { applyOperations } from "./utils/applyOps.js";
import { transformOp } from "./utils/transform.js";
import {
  getVersionHistory,
  getOperationChain,
  findCommonAncestor,
} from "./utils/versionUtils.js";

const app = express();
const httpServer = createServer(app); // Create HTTP server
const io = new Server(httpServer, {
  // Initialize Socket.io
  cors: {
    origin: [
      "http://localhost:5173",
      "https://mentormate-frontend.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const prisma = new PrismaClient();
dotenv.config();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mentormate-frontend.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
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
const SOCKET_ID_SUBSTRING_LENGTH = 2;
const EMPTY_ROOM_SIZE = 0;
const MAX_ROOM_CAPACITY = 10;
const ROOM_INACTIVITY_TIMEOUT = 3600000; // 1 hour in milliseconds
const DEFAULT_LANGUAGE = "javascript";
const DEFAULT_CODE_TEMPLATE = `// Welcome to collaborative coding!
// Start typing to see real-time updates`;

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

    const oldText = room.code;
    const newText = data.code;

    // Generate operations from client's changes
    const clientOps = generateDeltas(oldText, newText);

    // If there are concurrent operations that haven't been applied yet
    if (room.pendingOps && room.pendingOps.length > 0) {
      // Transform client operations against all pending operations
      let transformedClientOps = clientOps;
      for (const pendingOp of room.pendingOps) {
        transformedClientOps = transformOp(transformedClientOps, pendingOp);
      }

      // Apply transformed operations to the current room state
      room.code = applyOperations(room.code, transformedClientOps);

      // Add transformed client operations to pending operations
      room.pendingOps.push(transformedClientOps);
    } else {
      // No concurrent operations, just apply directly
      room.code = newText;
      room.pendingOps = [clientOps];
    }

    updateRoomActivity(roomId);

    const versionId = crypto.randomUUID();

    // Store the operation in the database
    await prisma.codeChange.create({
      data: {
        roomId: parseInt(roomId),
        userId: parseInt(userId),
        versionId,
        parentId: room.lastVersionId || null,
        operations: clientOps,
      },
    });

    room.lastVersionId = versionId;

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
      throw new Error("Error saving room session:", error);
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit("code-update", {
      code: room.code,
      userId,
      operations: clientOps,
    });

    // Clear pending operations after successful broadcast
    room.pendingOps = [];
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
      // Generate operations from the current room code and the new code
      const operations = generateDeltas(room.code, data.code);

      await prisma.codeChange.create({
        data: {
          roomId: roomId,

          userId: parseInt(userId),
          versionId,
          parentId: room.lastVersionId || null,
          operations,
        },
      });

      room.lastVersionId = versionId;

      socket.emit("version-saved", { versionId });
    } catch (err) {
      socket.emit("error", { message: "Failed to save version" });
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

  // Apply a specific version
  socket.on("apply-version", async (data) => {
    const { roomId, versionId } = data;
    const userRoom = userRooms.get(socket.id);
    if (!userRoom) return;

    try {
      // Get the version to apply
      const version = await prisma.codeChange.findFirst({
        where: { roomId: parseInt(roomId), versionId },
      });

      if (!version) {
        socket.emit("error", { message: "Version not found" });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Get all operations between current version and target version
      const operationChain = await getOperationChain(
        room.lastVersionId,
        versionId,
        roomId
      );

      // Apply the operations to the current code
      const newCode = applyOperations(room.code, operationChain.operations);
      room.code = newCode;
      room.lastVersionId = versionId;

      // Broadcast the new code to all users in the room
      io.to(roomId).emit("code-update", {
        code: newCode,
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

      // Save the merged version
      await prisma.codeChange.create({
        data: {
          room: {
            connect: { roomId },
          },
          user: {
            connect: { id: parseInt(userRoom.userId) },
          },
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
