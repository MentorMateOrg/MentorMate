import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  const { email, plainPassword } = req.body;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  try {
    const newUser = await prisma.user.create({
      data: { email, encrypted_password: hashedPassword },
    });
    const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, plainPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(plainPassword, user.encrypted_password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token, user: { id: user.id, email } });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

export default router;
