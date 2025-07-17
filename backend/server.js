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
import roomRoutes from "./routes/room.routes.js";
import generateDeltas from "./utils/delta.js";
import { applyOperations } from "./utils/applyOps.js";


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


    try {
      // Only save the current session state, not as a version
      await prisma.roomSession.create({
        data: {
          room: {
            connect: { roomId },
          },
          user: {
            connect: { id: parseInt(userId) },
          },
          code: data.code,
          language: room.language,
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
      // First find the room by roomId (string) to get the integer id
      const dbRoom = await prisma.room.findUnique({
        where: { roomId: roomId },
      });

      if (!dbRoom) {
        //error"Room not found in database" ;
        return;
      }

      // Get the base code to generate operations from
      let baseCode = DEFAULT_CODE_TEMPLATE;

      // If there's a previous version, reconstruct the code at that point
      if (room.lastVersionId) {
        try {
          // Get all versions up to the last saved version
          const allVersions = await prisma.codeChange.findMany({
            where: { roomId: dbRoom.id },
            orderBy: { timestamp: "asc" },
          });

          // Reconstruct the code at the last version
          let reconstructedCode = DEFAULT_CODE_TEMPLATE;
          const versionChain = [];

          // Build chain from root to last version
          let current = allVersions.find(
            (v) => v.versionId === room.lastVersionId
          );
          while (current) {
            versionChain.unshift(current);
            current = allVersions.find((v) => v.versionId === current.parentId);
          }

          // Apply operations to reconstruct the last saved state
          for (const change of versionChain) {
            reconstructedCode = applyOperations(
              reconstructedCode,
              change.operations
            );
          }

          baseCode = reconstructedCode;
        } catch (error) {
          // If reconstruction fails, use default template
          baseCode = DEFAULT_CODE_TEMPLATE;
        }
      }

      // Generate operations from the base code to the current code
      const operations = generateDeltas(baseCode, data.code);

      await prisma.codeChange.create({
        data: {
          roomId: dbRoom.id, // Use the integer id from the database
          userId: parseInt(userId),
          versionId,
          parentId: room.lastVersionId || null,
          operations,
        },
      });

      room.lastVersionId = versionId;
    } catch (err) {
      //error: Error saving version
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
