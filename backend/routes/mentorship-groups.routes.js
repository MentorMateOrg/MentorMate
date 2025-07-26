import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all mentorship groups
router.get("/", authToken, async (req, res) => {
  try {
    const groups = await prisma.mentorshipGroup.findMany({
      where: { isActive: true },
      include: {
        mentor: {
          include: {
            profile: true,
          },
        },
        memberships: {
          where: { status: "ACCEPTED" },
          include: {
            mentee: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mentorship groups" });
  }
});

// Get groups created by the current user (mentor)
router.get("/my-groups", authToken, async (req, res) => {
  try {
    const groups = await prisma.mentorshipGroup.findMany({
      where: {
        mentorId: req.user.id,
        isActive: true,
      },
      include: {
        memberships: {
          include: {
            mentee: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch your mentorship groups" });
  }
});

// Get groups the current user has joined (mentee)
router.get("/joined-groups", authToken, async (req, res) => {
  try {
    const memberships = await prisma.groupMembership.findMany({
      where: {
        menteeId: req.user.id,
        status: "ACCEPTED",
        group: {
          isActive: true,
        },
      },
      include: {
        group: {
          include: {
            mentor: {
              include: {
                profile: true,
              },
            },
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
      orderBy: { joinedAt: "desc" },
    });

    const groups = memberships
      .map((membership) => membership.group)
      .filter((group) => group !== null);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch joined groups" });
  }
});

// Get a specific mentorship group
router.get("/:id", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);

    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
      include: {
        mentor: {
          include: {
            profile: true,
          },
        },
        memberships: {
          include: {
            mentee: {
              include: {
                profile: true,
              },
            },
          },
        },
        posts: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    // Check if user has access to this group
    const isMentor = group.mentorId === req.user.id;
    const isMember = group.memberships.some(
      (membership) =>
        membership.menteeId === req.user.id && membership.status === "ACCEPTED"
    );

    if (!isMentor && !isMember) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mentorship group" });
  }
});

// Create a new mentorship group
router.post("/", authToken, async (req, res) => {
  try {
    const { name, description, maxMembers } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const group = await prisma.mentorshipGroup.create({
      data: {
        name,
        description,
        maxMembers: maxMembers || 10,
        mentorId: req.user.id,
      },
      include: {
        mentor: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to create mentorship group" });
  }
});

// Update a mentorship group
router.put("/:id", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { name, description, maxMembers, isActive } = req.body;

    // Check if user is the mentor of this group
    const existingGroup = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    if (existingGroup.mentorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the mentor can update this group" });
    }

    const updatedGroup = await prisma.mentorshipGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxMembers && { maxMembers }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        mentor: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACCEPTED" },
            },
          },
        },
      },
    });

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: "Failed to update mentorship group" });
  }
});

// Delete a mentorship group
router.delete("/:id", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);

    // Check if user is the mentor of this group
    const existingGroup = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
    });

    if (!existingGroup) {
      return res.status(404).json({ error: "Mentorship group not found" });
    }

    if (existingGroup.mentorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the mentor can delete this group" });
    }

    await prisma.mentorshipGroup.delete({
      where: { id: groupId },
    });

    res.json({ message: "Mentorship group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete mentorship group" });
  }
});

export default router;
