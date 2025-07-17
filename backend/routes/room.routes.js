// routes/room.routes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:roomId/history", async (req, res) => {
  const { roomId } = req.params;

  try {
    // First find the room by roomId (string) to get the integer id
    const room = await prisma.room.findUnique({
      where: { roomId: roomId },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    // Then find code changes using the room's integer id
    const codeChanges = await prisma.codeChange.findMany({
      where: { roomId: room.id },
      orderBy: { timestamp: "asc" },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(
      codeChanges.map((change) => ({
        versionId: change.versionId,
        parentId: change.parentId,
        timestamp: change.timestamp,
        author: change.user?.profile?.full_name || "Unknown",
        operations: change.operations,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
