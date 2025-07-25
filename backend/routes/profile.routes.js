import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/onboarding", authToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    const {
      fullName,
      role,
      profilePicUrl,
      githubUrl,
      linkedInUrl,
      interests,
      fieldOfKnowledge,
      experiences,
    } = req.body;

    const data = {
      full_name: fullName,
      role: role || "UNKNOWN",
      profilePicUrl,
      githubUrl,
      linkedinUrl: linkedInUrl,
      interests: interests || [],
      fieldOfKnowledge: fieldOfKnowledge || "",
      experiences: experiences || [],
    };

    const result = profile
      ? await prisma.profile.update({ where: { userId: req.user.id }, data })
      : await prisma.profile.create({
          data: { ...data, user: { connect: { id: req.user.id } } },
        });

    res.status(profile ? 200 : 201).json({
      message: profile ? "Profile updated" : "Profile created",
      profile: result,
    });
  } catch (err) {
    res.status(500).json({ message: "Onboarding failed", error: err.message });
  }
});

// Get current user's profile
router.get("/", authToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: err.message });
  }
});

router.put("/", authToken, async (req, res) => {
  const { full_name, bio, profilePicUrl, interests, experiences } = req.body;
  try {
    const updated = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { full_name, bio, profilePicUrl, interests, experiences },
    });
    res.status(200).json({ message: "Bio updated", profile: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

export default router;
