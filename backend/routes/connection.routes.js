import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/request", authenticateToken, async (req, res) => {
  const { receiverId } = req.body;
  try {
    const request = await prisma.connectionRequest.create({
      data: { senderId: req.user.id, receiverId },
    });
    res.status(201).json({ message: "Request sent", request });
  } catch (err) {
    res.status(500).json({ message: "Send failed", error: err.message });
  }
});

router.get("/requests", authenticateToken, async (req, res) => {
  try {
    const requests = await prisma.connectionRequest.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

export default router;
