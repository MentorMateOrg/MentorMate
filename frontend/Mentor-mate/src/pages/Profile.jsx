import React, { useState, useEffect } from "react";
import Connections from "./Connections";
import Navbar from "../components/Navbar";
import GithubActivity from "../components/GithubActivity";
import { API_URL } from "../config";
import { LoadingSpinnerWithText } from "../components/LoadingSpinner";
import { CardHoverEffect } from "../components/CursorEffects";

export default function Profile({ user, setUser }) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.profile?.bio || "");
  const [full_name, setFullName] = useState(user?.profile?.full_name || "");
  const [profilePicUrl, setProfilePicUrl] = useState(
    user?.profile?.profilePicUrl || ""
  );
  const [experiences, setExperiences] = useState(
    user?.profile?.experiences || []
  );
  const [interests, setInterests] = useState(user?.profile?.interests || []);
  const [githubUrl, setGithubUrl] = useState(user?.profile?.githubUrl || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.profile) {
      setBio(user.profile.bio || "");
      setFullName(user.profile.full_name || "");
      setProfilePicUrl(user.profile.profilePicUrl || "");
      setExperiences(user.profile.experiences || []);
      setInterests(user.profile.interests || []);
      setGithubUrl(user.profile.githubUrl || "");
    }
  }, [user]);

  if (!user || !user.profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinnerWithText text="Loading your profile..." size="large" />
      </div>
    );
  }

  const handleSaveBio = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          full_name,
          bio,
          profilePicUrl,
          interests,
          experiences,
          githubUrl,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUser((prev) => ({ ...prev, profile: data.profile }));
        setIsEditingBio(false);
      } else {
        alert("Failed to update bio");
      }
    } catch (err) {
      alert(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-md p-6 mb-8">
            {user.profile.profilePicUrl ? (
              <img
                src={user.profile.profilePicUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-2 border-purple-500"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 border-2 border-purple-500 flex items-center justify-center">
                <span className="text-gray-600 text-2xl font-semibold">
                  {user.profile.full_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="ml-0 md:ml-6 text-center md:text-left mt-4 md:mt-0">
              <h2 className="text-2xl font-semibold">
                {user.profile.full_name}
              </h2>
              <p className="text-gray-500">
                {user.profile.role || "Role not added"}
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
                  {user.profile.bio || "No bio added"}
                </p>
              </div>
              <button
                className="bg-purple-500 text-white px-8 cursor-pointer h-10 rounded-md hover:bg-purple-600"
                onClick={() => setIsEditingBio(true)}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-lg font-semibold mb-4">Experience</h3>
            {user.profile.experiences.map((experience, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-medium">{experience}</h4>
              </div>
            ))}
          </div>

          {/* Connections */}
          <Connections />

          {/* Github Activity - show for all users with GitHub URL */}
          {user.profile.githubUrl && (
            <GithubActivity githubUrl={user.profile.githubUrl} />
          )}

          {/* Modal to edit bio */}
          {isEditingBio && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white shadow-lg w-full max-w-md p-6 relative rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Edit Bio</h3>
                <h3>Name</h3>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows="1"
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                ></textarea>
                <h3>Bio</h3>

                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows="5"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                ></textarea>
                <h3>Skills</h3>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows="1"
                  value={interests.join("\n")}
                  onChange={(e) => setInterests(e.target.value.split("\n"))}
                ></textarea>
                <h3>Profile Picture URL</h3>

                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows="5"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  placeholder="Set your profile picture URL here..."
                ></textarea>

                <h3>GitHub URL</h3>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                />

                <h3>Experience</h3>

                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows="5"
                  value={experiences.join("\n")}
                  onChange={(e) => setExperiences(e.target.value.split("\n"))}
                  placeholder="Enter your experience here..."
                ></textarea>
                <button
                  onClick={handleSaveBio}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 ml-4"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
