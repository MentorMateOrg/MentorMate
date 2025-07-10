import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authToken, async (req, res) => {
  const { query } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { profile: { full_name: { contains: query, mode: "insensitive" } } },
          { profile: { interests: { has: query } } },
        ],
      },
      include: { profile: true },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

export default router;
