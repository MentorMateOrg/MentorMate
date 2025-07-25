import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMentorshipRoadmaps() {
  // Mentee Roadmap Template
  const menteeRoadmap = {
    title: "Complete Mentee Journey",
    description:
      "A comprehensive roadmap for mentees to maximize their mentorship experience",
    duration: 16, // 16 weeks (4 months)
    phase: "template",
    template: {
      roadmapSteps: [
        {
          id: 1,
          title: "Complete Your Profile",
          description:
            "Fill out your profile with skills, interests, and goals to help mentors understand you better",
          category: "setup",
          estimatedWeeks: 1,
          requirements: [
            "Add profile picture",
            "Complete bio",
            "List skills and interests",
            "Add experience",
          ],
          badges: ["Profile Complete"],
          order: 1,
        },
        {
          id: 2,
          title: "Find and Connect with a Mentor",
          description:
            "Browse mentor profiles and send connection requests to potential mentors",
          category: "networking",
          estimatedWeeks: 1,
          requirements: [
            "Browse mentor recommendations",
            "Send 3-5 connection requests",
            "Accept mentor connection",
          ],
          badges: ["Mentor Connect"],
          order: 2,
        },
        {
          id: 3,
          title: "Set Up Initial 1:1 Meeting",
          description:
            "Schedule your first meeting with your mentor to establish expectations and goals",
          category: "planning",
          estimatedWeeks: 1,
          requirements: [
            "Schedule first meeting",
            "Prepare questions",
            "Set meeting agenda",
          ],
          badges: ["First Meeting"],
          order: 3,
        },
        {
          id: 4,
          title: "Define Learning Goals",
          description:
            "Work with your mentor to set clear, achievable learning objectives",
          category: "goal-setting",
          estimatedWeeks: 1,
          requirements: [
            "Create 3-5 SMART goals",
            "Set target dates",
            "Define success metrics",
          ],
          badges: ["First Goal", "Goal Setter"],
          order: 4,
        },
        {
          id: 5,
          title: "Establish Regular Meeting Schedule",
          description:
            "Set up recurring meetings with your mentor (weekly or bi-weekly)",
          category: "planning",
          estimatedWeeks: 1,
          requirements: [
            "Agree on meeting frequency",
            "Set recurring calendar invites",
            "Choose communication tools",
          ],
          badges: ["Consistent Learner"],
          order: 5,
        },
        {
          id: 6,
          title: "Active Learning Phase",
          description:
            "Engage in regular learning activities and track progress on your goals",
          category: "learning",
          estimatedWeeks: 8,
          requirements: [
            "Attend weekly meetings",
            "Complete assigned tasks",
            "Update goal progress",
            "Ask questions actively",
          ],
          badges: ["Progress Tracker", "Milestone Master"],
          order: 6,
        },
        {
          id: 7,
          title: "Mid-Point Review",
          description: "Evaluate progress and adjust goals if needed",
          category: "review",
          estimatedWeeks: 1,
          requirements: [
            "Review goal progress",
            "Get mentor feedback",
            "Adjust goals if needed",
            "Celebrate achievements",
          ],
          badges: ["Self Reflector"],
          order: 7,
        },
        {
          id: 8,
          title: "Skill Application",
          description: "Apply learned skills in real projects or scenarios",
          category: "application",
          estimatedWeeks: 2,
          requirements: [
            "Work on practical project",
            "Get mentor guidance",
            "Document learnings",
          ],
          badges: ["Skill Applier"],
          order: 8,
        },
        {
          id: 9,
          title: "Share Knowledge",
          description:
            "Contribute to the community by sharing your learning experience",
          category: "community",
          estimatedWeeks: 1,
          requirements: [
            "Write a reflection post",
            "Share tips with other mentees",
            "Participate in community discussions",
          ],
          badges: ["Community Contributor", "Knowledge Sharer"],
          order: 9,
        },
        {
          id: 10,
          title: "Mentorship Completion",
          description: "Complete your mentorship journey and plan next steps",
          category: "completion",
          estimatedWeeks: 1,
          requirements: [
            "Complete final review",
            "Thank your mentor",
            "Plan continued learning",
            "Consider becoming a mentor",
          ],
          badges: ["Goal Achiever", "Mentorship Graduate"],
          order: 10,
        },
      ],
    },
  };

  // Mentor Roadmap Template
  const mentorRoadmap = {
    title: "Complete Mentor Journey",
    description:
      "A comprehensive roadmap for mentors to provide effective guidance and support",
    duration: 16, // 16 weeks (4 months)
    phase: "template",
    template: {
      roadmapSteps: [
        {
          id: 1,
          title: "Complete Mentor Profile",
          description:
            "Set up your mentor profile highlighting your expertise and mentoring style",
          category: "setup",
          estimatedWeeks: 1,
          requirements: [
            "Add professional photo",
            "Write mentor bio",
            "List expertise areas",
            "Set availability",
          ],
          badges: ["Mentor Profile Complete"],
          order: 1,
        },
        {
          id: 2,
          title: "Connect with Mentees",
          description:
            "Review mentee requests and accept connections with suitable matches",
          category: "networking",
          estimatedWeeks: 1,
          requirements: [
            "Review mentee profiles",
            "Accept connection requests",
            "Send welcome messages",
          ],
          badges: ["First Connection"],
          order: 2,
        },
        {
          id: 3,
          title: "Conduct Initial Assessment",
          description:
            "Meet with mentees to understand their goals and current skill level",
          category: "assessment",
          estimatedWeeks: 1,
          requirements: [
            "Schedule initial meetings",
            "Assess mentee skills",
            "Understand their goals",
          ],
          badges: ["Mentor Connect"],
          order: 3,
        },
        {
          id: 4,
          title: "Create Learning Plans",
          description: "Develop personalized learning plans for each mentee",
          category: "planning",
          estimatedWeeks: 1,
          requirements: [
            "Create SMART goals with mentees",
            "Design learning activities",
            "Set milestones",
          ],
          badges: ["Learning Architect"],
          order: 4,
        },
        {
          id: 5,
          title: "Establish Mentoring Rhythm",
          description:
            "Set up regular meeting schedules and communication patterns",
          category: "structure",
          estimatedWeeks: 1,
          requirements: [
            "Schedule regular meetings",
            "Set communication expectations",
            "Create meeting templates",
          ],
          badges: ["Structured Mentor"],
          order: 5,
        },
        {
          id: 6,
          title: "Active Mentoring Phase",
          description:
            "Provide ongoing guidance, feedback, and support to mentees",
          category: "mentoring",
          estimatedWeeks: 8,
          requirements: [
            "Conduct regular meetings",
            "Provide constructive feedback",
            "Track mentee progress",
            "Adjust plans as needed",
          ],
          badges: ["Active Mentor", "Feedback Master"],
          order: 6,
        },
        {
          id: 7,
          title: "Mid-Point Evaluation",
          description: "Evaluate mentoring effectiveness and mentee progress",
          category: "evaluation",
          estimatedWeeks: 1,
          requirements: [
            "Review mentee progress",
            "Gather feedback",
            "Adjust mentoring approach",
            "Celebrate wins",
          ],
          badges: ["Progress Evaluator"],
          order: 7,
        },
        {
          id: 8,
          title: "Advanced Guidance",
          description:
            "Provide advanced guidance and real-world application opportunities",
          category: "advanced",
          estimatedWeeks: 2,
          requirements: [
            "Introduce complex challenges",
            "Provide industry insights",
            "Connect mentees with opportunities",
          ],
          badges: ["Advanced Guide"],
          order: 8,
        },
        {
          id: 9,
          title: "Knowledge Sharing",
          description:
            "Share mentoring insights and contribute to the mentor community",
          category: "community",
          estimatedWeeks: 1,
          requirements: [
            "Share mentoring tips",
            "Participate in mentor forums",
            "Help other mentors",
          ],
          badges: ["Mentor Leader", "Community Builder"],
          order: 9,
        },
        {
          id: 10,
          title: "Mentoring Completion",
          description:
            "Complete the mentoring cycle and prepare mentees for independence",
          category: "completion",
          estimatedWeeks: 1,
          requirements: [
            "Conduct final review",
            "Provide transition guidance",
            "Maintain alumni network",
            "Reflect on experience",
          ],
          badges: ["Mentoring Master", "Lifecycle Completer"],
          order: 10,
        },
      ],
    },
  };
}

seedMentorshipRoadmaps().catch(console.error);
