// routes/room.routes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/room/:roomId/history", async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId: roomId },
      include: {
        codeChanges: {
          orderBy: { timestamp: "asc" },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(
      room.codeChanges.map((change) => ({
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
