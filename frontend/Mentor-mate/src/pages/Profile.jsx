import React, { useState, useEffect } from "react";
import Connections from "./Connections";

export default function Profile({ user }) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.profile?.bio || "");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setBio(data.profile.bio || "");
        } else {
          alert("Failed to fetch user profile");
        }
      } catch (err) {
        alert(err);
      }
    };

    fetchUserProfile();
  }, []);

  if (!user || !user.profile) {
    return <div className="text-center mt-10 text-gray-600">Loading...</div>;
  }
  function handleEditingBio() {
    setIsEditingBio(true);
  }

  const handleSaveBio = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/update-bio", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ bio }),
      });
      if (response.ok) {
        const data = await response.json();
        setBio(data.updatedProfile.bio);
        setIsEditingBio(false);
      } else {
        alert("Failed to update bio");
      }
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-md p-6 mb-8">
        <img
          src={user.profile.profilePicUrl}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-2 border-purple-500"
        />
        <div className="ml-0 md:ml-6 text-center md:text-left mt-4 md:mt-0">
          <h2 className="text-2xl font-semibold">{user.profile.full_name}</h2>
          <p className="text-gray-500">
            {user.profile.experiences[0] || "No experience added"}
          </p>
        </div>
      </div>

      {/* Skills and About */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Skills</h3>
          <ul className="space-y-2 text-gray-600">
            {user.profile.interests.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2 flex justify-between bg-white p-6 rounded-lg shadow-md">
          <div>
            <h3 className="text-lg font-semibold mb-3">About Me</h3>
            <p className="text-gray-700 leading-relaxed">
              {bio || "No bio added"}
            </p>
          </div>
          <button
            className="bg-purple-500 text-white px-8 cursor-pointer rounded-md hover:bg-purple-600"
            onClick={handleEditingBio}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Experience */}
      {/* Experience */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">Experience</h3>
        {user.profile.experiences.map((experience, index) => (
          <div key={index} className="mb-4">
            <h4 className="font-medium">{experience}</h4>
          </div>
        ))}
      </div>

      {isEditingBio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50  p-6 rounded-lg shadow-md mb-8">
          <div className="bg-white shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Edit Bio</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows="5"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Enter your bio here..."
            ></textarea>
            <button
              onClick={handleSaveBio}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingBio(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 ml-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
