import React, { useState, useEffect } from "react";

const MentorshipRoadmap = ({ userRole, onBack }) => {
  const [roadmapSteps, setRoadmapSteps] = useState([]);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Define roadmap templates based on role
  const menteeRoadmap = [
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
  ];

  const mentorRoadmap = [
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
      description: "Provide ongoing guidance, feedback, and support to mentees",
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
  ];

  useEffect(() => {
    // Set roadmap based on user role
    const roadmap = userRole === "MENTEE" ? menteeRoadmap : mentorRoadmap;
    setRoadmapSteps(roadmap);

    // Load user's progress from localStorage or API
    loadUserProgress();
  }, [userRole]);

  const loadUserProgress = () => {
    // For now, we'll use localStorage to simulate progress
    // In a real app, this would come from the API
    const savedProgress = localStorage.getItem(`roadmap_progress_${userRole}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedSteps(new Set(progress.completedSteps));
      setCurrentStep(progress.currentStep || 1);
    }
  };

  const saveUserProgress = (completed, current) => {
    const progress = {
      completedSteps: Array.from(completed),
      currentStep: current,
    };
    localStorage.setItem(
      `roadmap_progress_${userRole}`,
      JSON.stringify(progress)
    );
  };

  const toggleStepCompletion = (stepId) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      // Auto-advance to next step if this was the current step
      if (stepId === currentStep && stepId < roadmapSteps.length) {
        setCurrentStep(stepId + 1);
      }
    }
    setCompletedSteps(newCompleted);
    saveUserProgress(newCompleted, currentStep);
  };

  const getCategoryColor = (category) => {
    const colors = {
      setup: "bg-blue-100 text-blue-800",
      networking: "bg-green-100 text-green-800",
      planning: "bg-purple-100 text-purple-800",
      "goal-setting": "bg-yellow-100 text-yellow-800",
      learning: "bg-indigo-100 text-indigo-800",
      review: "bg-pink-100 text-pink-800",
      application: "bg-orange-100 text-orange-800",
      community: "bg-teal-100 text-teal-800",
      completion: "bg-gray-100 text-gray-800",
      assessment: "bg-cyan-100 text-cyan-800",
      structure: "bg-lime-100 text-lime-800",
      mentoring: "bg-emerald-100 text-emerald-800",
      evaluation: "bg-rose-100 text-rose-800",
      advanced: "bg-violet-100 text-violet-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getStepStatus = (stepId) => {
    if (completedSteps.has(stepId)) return "completed";
    if (stepId === currentStep) return "current";
    if (stepId < currentStep) return "available";
    return "locked";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "current":
        return "🎯";
      case "available":
        return "⭕";
      case "locked":
        return "🔒";
      default:
        return "⭕";
    }
  };

  const completionPercentage = Math.round(
    (completedSteps.size / roadmapSteps.length) * 100
  );

  return (
    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 text-sm"
            >
              ← Back
            </button>
          )}
          <h2 className="text-xl font-semibold text-purple-600">
            {userRole === "MENTEE" ? "Mentee" : "Mentor"} Roadmap
          </h2>
        </div>
        <div className="text-sm text-gray-600">
          {completedSteps.size}/{roadmapSteps.length} completed (
          {completionPercentage}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-purple-600">
            {completionPercentage}%
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Your {userRole === "MENTEE" ? "mentee" : "mentor"} journey progress
        </p>
      </div>

      {/* Roadmap Steps */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {roadmapSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          const isLocked = status === "locked";

          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : isCurrent
                  ? "bg-purple-50 border-purple-300 shadow-md"
                  : isLocked
                  ? "bg-gray-50 border-gray-200 opacity-60"
                  : "bg-white border-gray-200 hover:border-purple-200"
              }`}
            >
              {/* Step Number and Status */}
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-purple-500 text-white"
                      : isLocked
                      ? "bg-gray-300 text-gray-500"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {isCompleted ? "✓" : step.order}
                </div>

                <div className="flex-1">
                  {/* Title and Category */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3
                      className={`font-semibold ${
                        isLocked ? "text-gray-500" : "text-gray-800"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        step.category
                      )}`}
                    >
                      {step.category}
                    </span>
                    <span className="text-lg">{getStatusIcon(status)}</span>
                  </div>

                  {/* Description */}
                  <p
                    className={`text-sm mb-3 ${
                      isLocked ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {step.description}
                  </p>

                  {/* Requirements */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">
                      Requirements:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {step.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Badges and Duration */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Badges:</span>
                      <div className="flex gap-1">
                        {step.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                          >
                            🏆 {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{step.estimatedWeeks} week
                      {step.estimatedWeeks > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Action Button */}
                  {!isLocked && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleStepCompletion(step.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isCompleted
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : isCurrent
                            ? "bg-purple-500 text-white hover:bg-purple-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isCompleted
                          ? "Mark as Incomplete"
                          : "Mark as Complete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Line to Next Step */}
              {index < roadmapSteps.length - 1 && (
                <div className="absolute left-7 top-16 w-0.5 h-8 bg-gray-300"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-2">Journey Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Steps:</span>
            <span className="font-medium text-gray-800 ml-2">
              {roadmapSteps.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium text-green-600 ml-2">
              {completedSteps.size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Current Step:</span>
            <span className="font-medium text-purple-600 ml-2">
              {currentStep}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Estimated Duration:</span>
            <span className="font-medium text-gray-800 ml-2">16 weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorshipRoadmap;
