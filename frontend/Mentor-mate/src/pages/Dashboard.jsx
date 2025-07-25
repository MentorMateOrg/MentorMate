import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate, Link } from "react-router-dom";
import SearchBox from "../components/SearchBox";
import LiveCodingEditor from "./LiveCodingEditor";
import { API_URL } from "../config";
import { LoadingSpinnerWithText } from "../components/LoadingSpinner";
import { CardHoverEffect } from "../components/CursorEffects";

import TodoList from "../components/TodoList";
import ProgressTracker from "../components/ProgressTracker";
import CommunityArticles from "../components/CommunityArticles";

const Dashboard = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);

  const navigate = useNavigate();

  const handleLogOut = () => setShowLogoutModal(true);
  const onConfirm = () => {
    // Clear the token and navigate to login
    localStorage.removeItem("token");
    // Trigger a custom event to clear user data
    window.dispatchEvent(new Event("userLogout"));
    navigate("/login");
  };
  const onClose = () => setShowLogoutModal(false);

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const response = await fetch(`${API_URL}/api/recommendations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <>
      <Navbar />

      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Welcome to your Dashboard
          </h1>

          <div className="mb-10 flex justify-center">
            <SearchBox />
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Recommendations */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6 h-80 overflow-auto">
              <h2 className="text-xl font-semibold text-purple-600 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Recommended Matches
              </h2>
              <CardHoverEffect>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((profile) => (
                    <div
                      key={profile.id}
                      className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    >
                      <Link to={`/profile/${profile.userId}`} className="block">
                        <div className="flex items-center space-x-4">
                          {/* Profile Picture */}
                          <div className="flex-shrink-0">
                            {profile.profile_picture ? (
                              <img
                                src={profile.profile_picture}
                                alt={profile.full_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg ${
                                profile.profile_picture ? "hidden" : "flex"
                              }`}
                            >
                              {profile.full_name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-800 hover:text-purple-600 transition-colors truncate">
                              {profile.full_name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  profile.role === "mentor"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {profile.role === "mentor" ? "👨‍🏫" : "👨‍🎓"}{" "}
                                {profile.role}
                              </span>
                              {profile.experience_level && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  📊 {profile.experience_level}
                                </span>
                              )}
                            </div>
                            {profile.interests &&
                              profile.interests.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {profile.interests
                                      .slice(0, 3)
                                      .map((skill, index) => (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {profile.interests.length > 3 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                        +{profile.interests.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Arrow Icon */}
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-purple-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg">
                    No recommendations yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Complete your profile to get better matches!
                  </p>
                </div>
              )}
            </CardHoverEffect>
            </div>

            {/* Todos */}
            <TodoList />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Community Engagements */}
            <CardHoverEffect className="flex-1 bg-white rounded-lg shadow-md p-6">
              <CommunityArticles />
            </CardHoverEffect>

            {/* Progress */}

            <CardHoverEffect className="flex-1 bg-white rounded-lg shadow-md p-6">
              <ProgressTracker />
            </CardHoverEffect>

            {/* Live Coding */}
            <LiveCodingEditor />
            <CardHoverEffect className="flex-1 bg-white rounded-lg shadow-md p-6">
              <ProgressTracker />
            </CardHoverEffect>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to log out?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={onConfirm}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Yes, Logout
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
