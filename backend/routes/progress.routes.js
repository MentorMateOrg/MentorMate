import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// ============ GOALS ROUTES ============

// Get all goals for the authenticated user
router.get("/goals", authToken, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(goals);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch goals", error: error.message });
  }
});

// Create a new goal
router.post("/goals", authToken, async (req, res) => {
  try {
    const { title, description, targetDate, category, priority } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description: description || "",
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || "general",
        priority: priority || "medium",
        userId: req.user.id,
      },
      include: {
        milestones: true,
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create goal", error: error.message });
  }
});

// Update a goal
router.put("/goals/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      targetDate,
      completed,
      progress,
      category,
      priority,
    } = req.body;

    // Verify the goal belongs to the user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate !== undefined && {
          targetDate: targetDate ? new Date(targetDate) : null,
        }),
        ...(completed !== undefined && { completed }),
        ...(progress !== undefined && {
          progress: Math.max(0, Math.min(100, progress)),
        }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
      },
      include: {
        milestones: {
          orderBy: { order: "asc" },
        },
      },
    });

    res.json(updatedGoal);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update goal", error: error.message });
  }
});

// Delete a goal
router.delete("/goals/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the goal belongs to the user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await prisma.goal.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete goal", error: error.message });
  }
});

// ============ MILESTONES ROUTES ============

// Get milestones for a specific goal
router.get("/goals/:goalId/milestones", authToken, async (req, res) => {
  try {
    const { goalId } = req.params;

    // Verify the goal belongs to the user
    const goal = await prisma.goal.findFirst({
      where: { id: parseInt(goalId), userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const milestones = await prisma.milestone.findMany({
      where: { goalId: parseInt(goalId) },
      orderBy: { order: "asc" },
    });

    res.json(milestones);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch milestones", error: error.message });
  }
});

// Create a new milestone
router.post("/milestones", authToken, async (req, res) => {
  try {
    const { title, description, dueDate, goalId, order } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // If goalId is provided, verify the goal belongs to the user
    if (goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: parseInt(goalId), userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description: description || "",
        dueDate: dueDate ? new Date(dueDate) : null,
        goalId: goalId ? parseInt(goalId) : null,
        order: order || 0,
        userId: req.user.id,
      },
    });

    res.status(201).json(milestone);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create milestone", error: error.message });
  }
});

// Update a milestone
router.put("/milestones/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, completed, order } = req.body;

    // Verify the milestone belongs to the user
    const existingMilestone = await prisma.milestone.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingMilestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(completed !== undefined && {
          completed,
          completedAt: completed ? new Date() : null,
        }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(updatedMilestone);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update milestone", error: error.message });
  }
});

// Delete a milestone
router.delete("/milestones/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the milestone belongs to the user
    const existingMilestone = await prisma.milestone.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingMilestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    await prisma.milestone.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete milestone", error: error.message });
  }
});

// ============ BADGES ROUTES ============

// Get all available badges
router.get("/badges", async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { category: "asc" },
    });
    res.json(badges);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch badges", error: error.message });
  }
});

// Get user's earned badges
router.get("/user-badges", authToken, async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: "desc" },
    });
    res.json(userBadges);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch user badges", error: error.message });
  }
});

// Award a badge to a user (for testing purposes)
router.post("/award-badge", authToken, async (req, res) => {
  try {
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ message: "Badge ID is required" });
    }

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: parseInt(badgeId) },
    });

    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: req.user.id,
          badgeId: parseInt(badgeId),
        },
      },
    });

    if (existingUserBadge) {
      return res.status(400).json({ message: "User already has this badge" });
    }

    const userBadge = await prisma.userBadge.create({
      data: {
        userId: req.user.id,
        badgeId: parseInt(badgeId),
      },
      include: {
        badge: true,
      },
    });

    res.status(201).json(userBadge);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to award badge", error: error.message });
  }
});

// ============ MENTORSHIP PLANS ROUTES ============

// Get user's mentorship plans
router.get("/mentorship-plans", authToken, async (req, res) => {
  try {
    const plans = await prisma.mentorshipPlan.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentorship plans",
      error: error.message,
    });
  }
});

// Create a new mentorship plan
router.post("/mentorship-plans", authToken, async (req, res) => {
  try {
    const { title, description, duration, template } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const plan = await prisma.mentorshipPlan.create({
      data: {
        title,
        description: description || "",
        duration: duration || 12, // Default 12 weeks
        template: template || null,
        userId: req.user.id,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create mentorship plan",
      error: error.message,
    });
  }
});

// Update a mentorship plan
router.put("/mentorship-plans/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      duration,
      phase,
      startDate,
      endDate,
      template,
    } = req.body;

    // Verify the plan belongs to the user
    const existingPlan = await prisma.mentorshipPlan.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingPlan) {
      return res.status(404).json({ message: "Mentorship plan not found" });
    }

    const updatedPlan = await prisma.mentorshipPlan.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
        ...(phase !== undefined && { phase }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(template !== undefined && { template }),
      },
    });

    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update mentorship plan",
      error: error.message,
    });
  }
});

// Get progress overview for dashboard
router.get("/overview", authToken, async (req, res) => {
  try {
    // Get goals summary
    const totalGoals = await prisma.goal.count({
      where: { userId: req.user.id },
    });

    const completedGoals = await prisma.goal.count({
      where: { userId: req.user.id, completed: true },
    });

    // Get milestones summary
    const totalMilestones = await prisma.milestone.count({
      where: { userId: req.user.id },
    });

    const completedMilestones = await prisma.milestone.count({
      where: { userId: req.user.id, completed: true },
    });

    // Get recent achievements (badges earned in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBadges = await prisma.userBadge.count({
      where: {
        userId: req.user.id,
        earnedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get active mentorship plans
    const activePlans = await prisma.mentorshipPlan.count({
      where: {
        userId: req.user.id,
        phase: "active",
      },
    });

    // Get current goals with progress
    const currentGoals = await prisma.goal.findMany({
      where: {
        userId: req.user.id,
        completed: false,
      },
      include: {
        milestones: true,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    res.json({
      summary: {
        totalGoals,
        completedGoals,
        totalMilestones,
        completedMilestones,
        recentBadges,
        activePlans,
      },
      currentGoals,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch progress overview",
      error: error.message,
    });
  }
});

export default router;
