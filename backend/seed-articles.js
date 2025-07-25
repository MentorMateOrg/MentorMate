import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedArticles() {
  try {
    // Get some users to create articles for
    const users = await prisma.user.findMany({
      include: {
        profile: true,
      },
      take: 3,
    });

    if (users.length === 0) {
      console.log("No users found. Please create some users first.");
      return;
    }

    const sampleArticles = [
      {
        title: "Getting Started with React Hooks",
        content:
          "React Hooks have revolutionized the way we write React components. In this article, I'll share my experience transitioning from class components to functional components with hooks. The useState and useEffect hooks are game-changers for managing state and side effects. Here are some best practices I've learned: always use the dependency array in useEffect, avoid creating objects in render, and consider using useCallback for expensive computations.",
        authorId: users[0].id,
      },
      {
        title: "My Journey Learning JavaScript",
        content:
          "When I first started learning JavaScript, I was overwhelmed by concepts like closures, prototypes, and asynchronous programming. But with consistent practice and building real projects, everything started to click. My advice for beginners: start with the fundamentals, practice coding every day, and don't be afraid to make mistakes. Join coding communities, ask questions, and help others when you can. The JavaScript ecosystem is vast, but take it one step at a time.",
        authorId: users[1] ? users[1].id : users[0].id,
      },
      {
        title: "Tips for Effective Mentoring",
        content:
          "As a mentor, I've learned that the most important skill is active listening. Every mentee is different and has unique goals and challenges. Here are my top tips: 1) Set clear expectations from the beginning, 2) Be patient and encouraging, 3) Share your failures as well as successes, 4) Provide actionable feedback, 5) Help them build a network. Remember, mentoring is a two-way street - I often learn as much from my mentees as they do from me.",
        authorId: users[2] ? users[2].id : users[0].id,
      },
    ];

    for (const article of sampleArticles) {
      await prisma.article.create({
        data: article,
      });
    }

    console.log("Sample articles seeded successfully!");
  } catch (error) {
    console.error("Error seeding articles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedArticles();
