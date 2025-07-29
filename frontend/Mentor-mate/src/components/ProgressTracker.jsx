import React, { useState, useEffect } from "react";
import { API_URL } from "../config.js";
import MentorshipRoadmap from "./MentorshipRoadmap";

const ProgressTracker = () => {
  const [progressData, setProgressData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "technical",
    priority: "medium",
    targetDate: "",
  });

  // Fetch progress overview on component mount
  useEffect(() => {
    fetchProgressOverview();
    fetchUserBadges();
    fetchUserProfile();
  }, []);

  const fetchProgressOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/progress/overview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgressData(data.summary);
        setGoals(data.currentGoals);
      } else {
        alert("Failed to fetch progress overview. Please try again.");
      }
    } catch (error) {
      alert("Error fetching progress overview. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const response = await fetch(`${API_URL}/api/progress/user-badges`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const badges = await response.json();
        setUserBadges(badges);
      } else {
        alert("Failed to fetch user badges. Please try again.");
      }
    } catch (error) {
      alert("Error fetching user badges. Please check your connection.");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setUserRole(profile.role);
      } else {
        alert("Failed to fetch user profile. Please try again.");
      }
    } catch (error) {
      alert("Error fetching user profile. Please check your connection.");
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/progress/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: newGoal.title.trim(),
          description: newGoal.description.trim(),
          category: newGoal.category,
          priority: newGoal.priority,
          targetDate: newGoal.targetDate || null,
        }),
      });

      if (response.ok) {
        const goal = await response.json();
        setGoals([goal, ...goals]);
        setNewGoal({
          title: "",
          description: "",
          category: "technical",
          priority: "medium",
          targetDate: "",
        });
        setShowAddGoal(false);
        // Refresh overview to update counts
        fetchProgressOverview();
      } else {
        alert("Failed to add goal. Please try again.");
      }
    } catch (error) {
      alert("Error adding goal. Please check your connection.");
    }
  };

  const updateGoalProgress = async (goalId, progress) => {
    try {
      const response = await fetch(`${API_URL}/api/progress/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          progress: Math.max(0, Math.min(100, progress)),
        }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(
          goals.map((goal) => (goal.id === goalId ? updatedGoal : goal))
        );
        // Refresh overview to update counts
        fetchProgressOverview();
      } else {
        alert("Failed to update goal progress. Please try again.");
      }
    } catch (error) {
      alert("Error updating goal progress. Please check your connection.");
    }
  };

  const toggleGoalCompletion = async (goalId, completed) => {
    try {
      const response = await fetch(`${API_URL}/api/progress/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          completed: !completed,
          progress: !completed ? 100 : 0,
        }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(
          goals.map((goal) => (goal.id === goalId ? updatedGoal : goal))
        );
        // Refresh overview to update counts
        fetchProgressOverview();
      } else {
        alert("Failed to toggle goal completion. Please try again.");
      }
    } catch (error) {
      alert("Error toggling goal completion. Please check your connection.");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "technical":
        return "text-blue-600 bg-blue-100";
      case "communication":
        return "text-purple-600 bg-purple-100";
      case "leadership":
        return "text-indigo-600 bg-indigo-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-purple-600 mb-4">
          My Progress
        </h2>
        <p className="text-gray-500">Loading progress data...</p>
      </div>
    );
  }

  // Show roadmap if user clicked the roadmap button
  if (showRoadmap && userRole) {
    return (
      <MentorshipRoadmap
        userRole={userRole}
        onBack={() => setShowRoadmap(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-600">My Progress</h2>
        <div className="flex gap-2">
          {userRole && (
            <button
              onClick={() => setShowRoadmap(true)}
              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm"
            >
              📍 Roadmap
            </button>
          )}
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 text-sm"
          >
            {showAddGoal ? "Cancel" : "+ Add Goal"}
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      {progressData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {progressData.completedGoals}
            </div>
            <div className="text-xs text-blue-500">Goals Completed</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progressData.completedMilestones}
            </div>
            <div className="text-xs text-green-500">Milestones</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {userBadges.length}
            </div>
            <div className="text-xs text-yellow-500">Badges Earned</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {progressData.activePlans}
            </div>
            <div className="text-xs text-purple-500">Active Plans</div>
          </div>
        </div>
      )}

      {/* Recent Badges */}
      {userBadges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Recent Achievements
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {userBadges.slice(0, 5).map((userBadge) => (
              <div
                key={userBadge.id}
                className="flex-shrink-0 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-2 text-center min-w-[80px]"
                title={userBadge.badge.description}
              >
                <div className="text-2xl mb-1">{userBadge.badge.icon}</div>
                <div className="text-xs font-medium text-yellow-800">
                  {userBadge.badge.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showAddGoal && (
        <form onSubmit={addGoal} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) =>
                setNewGoal({ ...newGoal, title: e.target.value })
              }
              placeholder="Goal title (e.g., Learn React Hooks)"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <input
              type="date"
              value={newGoal.targetDate}
              onChange={(e) =>
                setNewGoal({ ...newGoal, targetDate: e.target.value })
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <select
              value={newGoal.category}
              onChange={(e) =>
                setNewGoal({ ...newGoal, category: e.target.value })
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="technical">Technical</option>
              <option value="communication">Communication</option>
              <option value="leadership">Leadership</option>
              <option value="general">General</option>
            </select>
            <select
              value={newGoal.priority}
              onChange={(e) =>
                setNewGoal({ ...newGoal, priority: e.target.value })
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <textarea
            value={newGoal.description}
            onChange={(e) =>
              setNewGoal({ ...newGoal, description: e.target.value })
            }
            placeholder="Goal description (optional)"
            className="w-full mt-3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="2"
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
            >
              Add Goal
            </button>
          </div>
        </form>
      )}

      {/* Current Goals */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No goals yet!</p>
            <p className="text-sm text-gray-400">
              Click "Add Goal" to start tracking your progress
            </p>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 rounded-lg border ${
                goal.completed
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() =>
                        toggleGoalCompletion(goal.id, goal.completed)
                      }
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <h4
                      className={`font-medium text-sm ${
                        goal.completed
                          ? "line-through text-gray-500"
                          : "text-gray-700"
                      }`}
                    >
                      {goal.title}
                    </h4>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-600 ml-6">
                      {goal.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      goal.category
                    )}`}
                  >
                    {goal.category}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      goal.priority
                    )}`}
                  >
                    {goal.priority}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="ml-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 min-w-[40px]">
                    {goal.progress}%
                  </span>
                </div>

                {/* Progress Controls */}
                {!goal.completed && (
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        updateGoalProgress(goal.id, goal.progress + 10)
                      }
                      className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      +10%
                    </button>
                    <button
                      onClick={() =>
                        updateGoalProgress(goal.id, goal.progress + 25)
                      }
                      className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      +25%
                    </button>
                    {goal.progress > 0 && (
                      <button
                        onClick={() =>
                          updateGoalProgress(goal.id, goal.progress - 10)
                        }
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        -10%
                      </button>
                    )}
                  </div>
                )}

                {/* Target Date */}
                {goal.targetDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {goals.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {goals.filter((goal) => goal.completed).length} of {goals.length}{" "}
          goals completed
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
