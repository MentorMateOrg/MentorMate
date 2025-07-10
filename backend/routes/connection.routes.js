import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/request", authToken, async (req, res) => {
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

router.get("/requests", authToken, async (req, res) => {
  try {
    const requests = await prisma.connectionRequest.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// Get pending connection requests received by the current user
router.get("/requests/pending", authToken, async (req, res) => {
  try {
    const pendingRequests = await prisma.connectionRequest.findMany({
      where: {
        receiverId: req.user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });
    res.json(pendingRequests);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
});

// Accept a connection request
router.put("/requests/:id/accept", authToken, async (req, res) => {
  const { id } = req.params;
  try {
    // First, verify the request exists and belongs to the current user
    const request = await prisma.connectionRequest.findFirst({
      where: {
        id: parseInt(id),
        receiverId: req.user.id,
        status: "PENDING",
      },
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Connection request not found or already processed" });
    }

    // Update the request status to ACCEPTED
    const updatedRequest = await prisma.connectionRequest.update({
      where: { id: parseInt(id) },
      data: { status: "ACCEPTED" },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json({
      message: "Connection request accepted",
      request: updatedRequest,
    });
  } catch (err) {
    res.status(500).json({ message: "Accept failed", error: err.message });
  }
});

// Reject a connection request
router.put("/requests/:id/reject", authToken, async (req, res) => {
  const { id } = req.params;
  try {
    // First, verify the request exists and belongs to the current user
    const request = await prisma.connectionRequest.findFirst({
      where: {
        id: parseInt(id),
        receiverId: req.user.id,
        status: "PENDING",
      },
    });

    if (!request) {
      return res
        .status(404)
        .json({ message: "Connection request not found or already processed" });
    }

    // Update the request status to REJECTED
    const updatedRequest = await prisma.connectionRequest.update({
      where: { id: parseInt(id) },
      data: { status: "REJECTED" },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json({
      message: "Connection request rejected",
      request: updatedRequest,
    });
  } catch (err) {
    res.status(500).json({ message: "Reject failed", error: err.message });
  }
});

// Get accepted connections (friends/connections)
router.get("/connections", authToken, async (req, res) => {
  try {
    const connections = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          { senderId: req.user.id, status: "ACCEPTED" },
          { receiverId: req.user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Transform the data to show the "other" person in each connection
    const transformedConnections = connections.map((connection) => {
      const isCurrentUserSender = connection.senderId === req.user.id;
      const connectedUser = isCurrentUserSender
        ? connection.receiver
        : connection.sender;

      return {
        id: connection.id,
        connectedUser,
        connectedAt: connection.createdAt,
      };
    });

    res.json(transformedConnections);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Fetch connections failed", error: err.message });
  }
});

export default router;
