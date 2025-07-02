import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import SearchBox from "../components/SearchBox";

const Dashboard = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const navigate = useNavigate();

  const handleLogOut = () => {
    setShowLogoutModal(true);
  };

  function onConfirm() {
    navigate("/login");
  }

  function onClose() {
    setShowLogoutModal(false);
  }
  useEffect(() => {
    const fetcRecommendations = async () => {
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
    fetcRecommendations();
  }, []);

  return (
    <>
      <Navbar handleLogOut={handleLogOut} />
      <div className=" bg-gray-100 p-8 min-h-screen">
        <div className="flex justify-center ">
          <SearchBox />
        </div>
        <div className="flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">
              {recommendations.length} Recommended Mentors/Mentees
            </h2>
            <ul className="text-blue-800 ">
              {recommendations.map((profile) => (
                <li key={profile.id}>
                  <h3>{profile.full_name}</h3>
                  <p>Role: {profile.role}</p>
                  <p>Interests: {profile.interests.join(", ")}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">Todos</h2>
            <ul>
              <li>Set up 1:1 with mentor</li>
              <li>Set up 1:1 with mentee</li>
              <li>Set up 1:1 with mentor</li>
              <li>Set up 1:1 with mentee</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">Community Engagements</h2>
            <p>Community Engagments will be shown here</p>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">
              Recommended Mentors/Mentees
            </h2>
            <ul className="text-blue-800 ">
              <li>
                <a href="#">Vidushi Seth</a>
              </li>
              <li>
                <a href="#">Eva Garces</a>
              </li>
              <li>
                <a href="#">Yi Shang</a>
              </li>
              <li>
                <a href="#">Mark Zuckerberg</a>
              </li>
              <li>
                <a href="#">Bill Gates</a>
              </li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">Todos</h2>
            <ul>
              <li>Set up 1:1 with mentor</li>
              <li>Set up 1:1 with mentee</li>
              <li>Set up 1:1 with mentor</li>
              <li>Set up 1:1 with mentee</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded shadow-md w-1/3 text-center m-4 h-80">
            <h2 className="text-2xl font-bold mb-6">Community Engagements</h2>
            <p>Community Engagments will be shown here</p>
          </div>
        </div>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-4 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to log out?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={onConfirm}
                className="bg-red-500 text-black px-4 py-2 rounded"
              >
                Yes, Logout
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded"
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
