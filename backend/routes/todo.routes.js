import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all todos for the authenticated user
router.get("/", authToken, async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(todos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch todos", error: error.message });
  }
});

// Create a new todo
router.post("/", authToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || "",
        userId: req.user.id,
        completed: false,
      },
    });

    res.status(201).json(todo);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create todo", error: error.message });
  }
});

// Update a todo (mark as completed/uncompleted or edit)
router.put("/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Verify the todo belongs to the user
    const existingTodo = await prisma.todo.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed }),
      },
    });

    res.json(updatedTodo);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update todo", error: error.message });
  }
});

// Delete a todo
router.delete("/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the todo belongs to the user
    const existingTodo = await prisma.todo.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });

    if (!existingTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    await prisma.todo.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete todo", error: error.message });
  }
});

export default router;
