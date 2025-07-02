import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

app.post("/api/signup", async (req, res) => {
  const { email, plainPassword } = req.body;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  try {
    const newUser = await prisma.user.create({
      data: { email: email, encrypted_password: hashedPassword },
    });
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    throw new Error(err);
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, plainPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userPresent = await bcrypt.compare(
      plainPassword,
      user.encrypted_password
    );
    if (!userPresent) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    throw new Error(err);
  }
});

app.post("/api/onboarding", authenticateToken, async (req, res) => {
  try {
    const findUserProfile = await prisma.profile.findUnique({
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

    const userRole = role || "UNKNOWN";

    if (findUserProfile) {
      const updatedProfile = await prisma.profile.update({
        where: { userId: req.user.id },
        data: {
          full_name: fullName,
          role: userRole,
          profilePicUrl: profilePicUrl,
          githubUrl: githubUrl,
          linkedinUrl: linkedInUrl,
          interests: interests || [],
          fieldOfKnowledge: fieldOfKnowledge || "",
          experiences: experiences || [],
        },
      });
      res
        .status(200)
        .json({ message: "Profile updated successfully", updatedProfile });
    } else {
      const newProfile = await prisma.profile.create({
        data: {
          full_name: fullName,
          role: userRole,
          profilePicUrl: profilePicUrl,
          githubUrl: githubUrl,
          linkedinUrl: linkedInUrl,
          interests: interests || [],
          fieldOfKnowledge: fieldOfKnowledge || "",
          experiences: experiences || [],
          user: { connect: { id: req.user.id } },
        },
      });
      res
        .status(201)
        .json({ message: "Profile created successfully", newProfile });
    }
  } catch (err) {
    alert(err);
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

app.get("/api/search", authenticateToken, async (req, res) => {
  const { query } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            profile: {
              full_name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            profile: {
              interests: {
                has: query,
              },
            },
          },
        ],
      },
      include: {
        profile: true,
      },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.get("/api/recommendations", authenticateToken, async (req, res) => {
  try {
    const userProfile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const recommendations = await prisma.profile.findMany({
      where: {
        AND: [
          { userId: { not: req.user.id } }, // Exclude the current user
          {
            interests: {
              hasSome: userProfile.interests, // Match any of the user's interests
            },
          },
          {
            role: userProfile.role === "MENTEE" ? "MENTOR" : "MENTEE", // Recommend opposite role
          },
        ],
      },
      include: {
        user: true,
      },
    });

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.post("/api/connection-request", authenticateToken, async (req, res) => {
  const { receiverId } = req.body;
  try {
    const newRequest = await prisma.connectionRequest.create({
      data: {
        senderId: req.user.id,
        receiverId: receiverId,
      },
    });
    res.status(201).json({ message: "Connection request sent", newRequest });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.get("/api/connection-requests", authenticateToken, async (req, res) => {
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
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.get("/api/user", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.put("/api/update-bio", authenticateToken, async (req, res) => {
  const { bio } = req.body;
  try {
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { bio: bio },
    });
    res
      .status(200)
      .json({ message: "Bio updated successfully", updatedProfile });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
