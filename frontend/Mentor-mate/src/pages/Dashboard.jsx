import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";

const Dashboard = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const navigate = useNavigate();

  const handleLogOut = () => setShowLogoutModal(true);
  const onConfirm = () => navigate("/login");
  const onClose = () => setShowLogoutModal(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/recommendations",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        alert(err);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <>
      <Navbar handleLogOut={handleLogOut} />

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
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-purple-600 mb-4">
                Recommended Matches
              </h2>
              {recommendations.length > 0 ? (
                <ul className="space-y-2 text-gray-700">
                  {recommendations.map((profile) => (
                    <li key={profile.id} className="border-b pb-2">
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-sm text-gray-500">
                        Role: {profile.role}
                      </p>
                      <p className="text-sm text-gray-500">
                        Skills: {profile.interests.join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No recommendations yet.</p>
              )}
            </div>

            {/* Todos */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-purple-600 mb-4">
                Your Todos
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Set up 1:1 with mentor</li>
                <li>Set up 1:1 with mentee</li>
                <li>Complete onboarding tasks</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Community Engagements */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-purple-600 mb-4">
                Community Engagements
              </h2>
              <p className="text-gray-600">
                Join upcoming events, workshops, or peer study sessions. Stay
                active!
              </p>
            </div>

            {/* Mentorship Progress */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-purple-600 mb-4">
                My Progress
              </h2>
              <p className="text-gray-600">
                Track your mentorship journey and achievements here.
              </p>
            </div>
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
