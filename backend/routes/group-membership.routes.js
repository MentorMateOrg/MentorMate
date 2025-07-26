import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Request to join a group
router.post("/join/:groupId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const menteeId = req.user.id;

    // Check if group exists and is active
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    if (!group.isActive) {
      return res.status(400).json({ error: "This group is no longer active" });
    }

    // Check if group is full
    if (group._count.memberships >= group.maxMembers) {
      return res.status(400).json({ error: "This group is full" });
    }

    // Check if user is the mentor of this group
    if (group.mentorId === menteeId) {
      return res
        .status(400)
        .json({ error: "Mentors cannot join their own groups" });
    }

    // Check if user already has a membership request or is already a member
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_menteeId: {
          groupId,
          menteeId,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "ACCEPTED") {
        return res
          .status(400)
          .json({ error: "You are already a member of this group" });
      } else if (existingMembership.status === "PENDING") {
        return res
          .status(400)
          .json({ error: "You already have a pending request for this group" });
      } else if (existingMembership.status === "REJECTED") {
        // Update the rejected request to pending
        const updatedMembership = await prisma.groupMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: "PENDING",
            joinedAt: new Date(),
          },
          include: {
            mentee: {
              include: {
                profile: true,
              },
            },
            group: {
              include: {
                mentor: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        });

        return res.status(201).json(updatedMembership);
      }
    }

    // Create new membership request
    const membership = await prisma.groupMembership.create({
      data: {
        groupId,
        menteeId,
        status: "PENDING",
      },
      include: {
        mentee: {
          include: {
            profile: true,
          },
        },
        group: {
          include: {
            mentor: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ error: "Failed to join group" });
  }
});

// Get pending membership requests for mentor's groups
router.get("/pending-requests", authToken, async (req, res) => {
  try {
    const mentorId = req.user.id;

    const pendingRequests = await prisma.groupMembership.findMany({
      where: {
        status: "PENDING",
        group: {
          mentorId: mentorId,
        },
      },
      include: {
        mentee: {
          include: {
            profile: true,
          },
        },
        group: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

// Get membership requests for a specific group
router.get("/group/:groupId/requests", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);

    // Check if user is the mentor of this group
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    if (group.mentorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the mentor can view membership requests" });
    }

    const requests = await prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        mentee: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch membership requests" });
  }
});

// Accept or reject a membership request
router.put("/request/:requestId", authToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const { status } = req.body;

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be ACCEPTED or REJECTED" });
    }

    // Get the membership request
    const membership = await prisma.groupMembership.findUnique({
      where: { id: requestId },
      include: {
        group: {
          include: {
            _count: {
              select: {
                memberships: {
                  where: { status: "ACCEPTED" },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: "Membership request not found" });
    }

    // Check if user is the mentor of this group
    if (membership.group.mentorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the mentor can manage membership requests" });
    }

    // Check if group is full when accepting
    if (
      status === "ACCEPTED" &&
      membership.group._count.memberships >= membership.group.maxMembers
    ) {
      return res
        .status(400)
        .json({ error: "Cannot accept request - group is full" });
    }

    // Update membership status
    const updatedMembership = await prisma.groupMembership.update({
      where: { id: requestId },
      data: { status },
      include: {
        mentee: {
          include: {
            profile: true,
          },
        },
        group: {
          include: {
            mentor: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedMembership);
  } catch (error) {
    res.status(500).json({ error: "Failed to update membership request" });
  }
});

// Leave a group (for mentees)
router.delete("/leave/:groupId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const menteeId = req.user.id;

    // Find the membership
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_menteeId: {
          groupId,
          menteeId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    // Delete the membership
    await prisma.groupMembership.delete({
      where: { id: membership.id },
    });

    res.json({ message: "Successfully left the group" });
  } catch (error) {
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// Remove a member from group (for mentors)
router.delete("/remove/:groupId/:menteeId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const menteeId = parseInt(req.params.menteeId);

    // Check if user is the mentor of this group
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    if (group.mentorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the mentor can remove members" });
    }

    // Find and delete the membership
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_menteeId: {
          groupId,
          menteeId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    await prisma.groupMembership.delete({
      where: { id: membership.id },
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Get user's membership status for a specific group
router.get("/status/:groupId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;

    // Check if user is the mentor
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.mentorId === userId) {
      return res.json({ status: "MENTOR", isMentor: true });
    }

    // Check membership status
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_menteeId: {
          groupId,
          menteeId: userId,
        },
      },
    });

    if (!membership) {
      return res.json({ status: "NOT_MEMBER", isMentor: false });
    }

    res.json({
      status: membership.status,
      isMentor: false,
      joinedAt: membership.joinedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get membership status" });
  }
});

export default router;
