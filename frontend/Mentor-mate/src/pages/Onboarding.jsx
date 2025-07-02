import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Dashboard from "./Dashboard";

const Onboarding = ({ role, setRole }) => {
  const [fullName, setFullName] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [fieldOfKnowledge, setFieldOfKnowledge] = useState("");
  const [experiences, setExperiences] = useState([]);
  const [selectedRole, setSelectedRole] = useState(role || "UNKNOWN");

  const navigate = useNavigate();

  const handleExperienceChange = (e) => {
    setExperiences(e.target.value.split(",").map((exp) => exp.trim()));
  };

  const handleOnboarding = async (onboarding) => {
    onboarding.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("token not found ");
      return;
    }
    const response = await fetch("http://localhost:5000/api/profile/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: fullName,
        role: selectedRole,
        profilePicUrl: profilePicUrl,
        linkedInUrl: linkedInUrl,
        githubUrl: githubUrl,
        fieldOfKnowledge: fieldOfKnowledge,
        experiences: experiences,
        interests: techStack.split(",").map((interest) => interest.trim()),
      }),
    });
    const user = await response.json();
    if (response.ok) {
      navigate("/dashboard");
    } else {
      alert("Error onboarding user");
    }
  };

  function renderMenteeOnboarding() {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
              Onboarding for Mentees
            </h1>
            <form onSubmit={handleOnboarding} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Github URL
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourname"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tech Stack
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="React, Node.js, Python"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="UNKNOWN">Select Role</option>
                  <option value="MENTEE">Mentee</option>
                  <option value="MENTOR">Mentor</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition cursor-pointer"
              >
                Complete Onboarding
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  function renderMentorOnboarding() {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
              Onboarding for Mentors
            </h1>
            <form onSubmit={handleOnboarding} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Field of Knowledge
                </label>
                <input
                  type="text"
                  value={fieldOfKnowledge}
                  onChange={(e) => setFieldOfKnowledge(e.target.value)}
                  placeholder="Software Engineering, Data Science, etc."
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experiences
                </label>
                <input
                  type="text"
                  value={experiences.join(", ")}
                  onChange={handleExperienceChange}
                  placeholder="AI Engineer, Tech Program Manager, etc."
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tech Stack
                </label>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="React, Node.js, Python"
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="UNKNOWN">Select Role</option>
                  <option value="MENTEE">Mentee</option>
                  <option value="MENTOR">Mentor</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition cursor-pointer"
              >
                Complete Onboarding
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <div>
            {role === "MENTEE"
              ? renderMenteeOnboarding()
              : renderMentorOnboarding()}
          </div>
        </div>
      </div>
    </>
  );
};
export default Onboarding;
