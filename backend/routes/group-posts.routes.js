import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all posts for a specific group
router.get("/group/:groupId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;

    // Check if user has access to this group
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: { menteeId: userId, status: "ACCEPTED" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMentor = group.mentorId === userId;
    const isMember = group.memberships.length > 0;

    if (!isMentor && !isMember) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    const posts = await prisma.groupPost.findMany({
      where: { groupId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch group posts" });
  }
});

// Create a new post in a group
router.post("/group/:groupId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content is required" });
    }

    // Check if user has access to this group
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: { menteeId: userId, status: "ACCEPTED" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.isActive) {
      return res.status(400).json({ error: "Cannot post in inactive group" });
    }

    const isMentor = group.mentorId === userId;
    const isMember = group.memberships.length > 0;

    if (!isMentor && !isMember) {
      return res.status(403).json({ error: "Only group members can post" });
    }

    const post = await prisma.groupPost.create({
      data: {
        content: content.trim(),
        authorId: userId,
        groupId,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get a specific post
router.get("/:postId", authToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    const post = await prisma.groupPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        group: {
          include: {
            memberships: {
              where: { menteeId: userId, status: "ACCEPTED" },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user has access to this group
    const isMentor = post.group.mentorId === userId;
    const isMember = post.group.memberships.length > 0;

    if (!isMentor && !isMember) {
      return res.status(403).json({ error: "Access denied to this post" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Update a post
router.put("/:postId", authToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Post content is required" });
    }

    const existingPost = await prisma.groupPost.findUnique({
      where: { id: postId },
      include: {
        group: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author of the post
    if (existingPost.authorId !== userId) {
      return res
        .status(403)
        .json({ error: "Only the author can edit this post" });
    }

    const updatedPost = await prisma.groupPost.update({
      where: { id: postId },
      data: { content: content.trim() },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete a post
router.delete("/:postId", authToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    const existingPost = await prisma.groupPost.findUnique({
      where: { id: postId },
      include: {
        group: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author or the group mentor
    const isAuthor = existingPost.authorId === userId;
    const isMentor = existingPost.group.mentorId === userId;

    if (!isAuthor && !isMentor) {
      return res.status(403).json({
        error: "Only the author or group mentor can delete this post",
      });
    }

    await prisma.groupPost.delete({
      where: { id: postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Get posts by a specific user in a group
router.get("/group/:groupId/user/:userId", authToken, async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;

    // Check if current user has access to this group
    const group = await prisma.mentorshipGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: { menteeId: currentUserId, status: "ACCEPTED" },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMentor = group.mentorId === currentUserId;
    const isMember = group.memberships.length > 0;

    if (!isMentor && !isMember) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    const posts = await prisma.groupPost.findMany({
      where: {
        groupId,
        authorId: targetUserId,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

export default router;
