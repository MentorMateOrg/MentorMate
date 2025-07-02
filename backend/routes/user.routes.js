import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

export default router;
