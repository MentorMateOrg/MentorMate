import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBadges() {
  const badges = [
    {
      name: "First Goal",
      description: "Created your first goal",
      icon: "🎯",
      category: "achievement",
      criteria: "Create your first goal",
    },
    {
      name: "Goal Achiever",
      description: "Completed your first goal",
      icon: "🏆",
      category: "achievement",
      criteria: "Complete your first goal",
    },
    {
      name: "Milestone Master",
      description: "Completed 5 milestones",
      icon: "⭐",
      category: "progress",
      criteria: "Complete 5 milestones",
    },
    {
      name: "Consistent Learner",
      description: "Active for 7 consecutive days",
      icon: "🔥",
      category: "progress",
      criteria: "Be active for 7 consecutive days",
    },
    {
      name: "Mentor Connect",
      description: "Connected with your first mentor",
      icon: "🤝",
      category: "community",
      criteria: "Connect with your first mentor",
    },
    {
      name: "Progress Tracker",
      description: "Updated progress on 10 goals",
      icon: "📈",
      category: "progress",
      criteria: "Update progress on 10 different goals",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  await prisma.$disconnect();
}

seedBadges().catch(console.error);
