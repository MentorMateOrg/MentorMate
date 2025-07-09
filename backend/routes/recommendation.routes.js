import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile)
      return res.status(404).json({ message: "Profile not found" });

    const others = await prisma.profile.findMany({
      where: {
        userId: { not: req.user.id },
        interests: { hasSome: profile.interests },
        role: profile.role === "MENTEE" ? "MENTOR" : "MENTEE",
      },
      include: { user: true },
    });

    res.json(others);
  } catch (err) {
    res.status(500).json({ message: "Failed to get recommendations", error: err.message });
  }
});

export default router;
