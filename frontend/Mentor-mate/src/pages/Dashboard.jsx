import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  return (
    <>
      <Navbar handleLogOut={handleLogOut} />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          <h2 className="text-2xl font-bold mb-6">Welcome to MentorMate!</h2>
          <p>This is your dashboard. More features coming soon</p>
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
