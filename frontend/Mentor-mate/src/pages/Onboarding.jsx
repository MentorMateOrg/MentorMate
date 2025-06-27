import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Dashboard from "./Dashboard";

const Onboarding = () => {
  const [fullName, setFullName] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");

  const navigate = useNavigate();

  const handleOnboarding = async (onboarding) => {
    onboarding.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("token not found ");
      return;
    }
    const response = await fetch("http://localhost:5000/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: fullName,
        role: "MENTEE",
        profilePicUrl: profilePicUrl,
        linkedInUrl: linkedInUrl,
        githubUrl: githubUrl,
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
  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <div>
            <form onSubmit={handleOnboarding}>
              <h1 className="mb-4">Onboarding</h1>
              <div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  placeholder="Profile Picture URL"
                  className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="LinkedIn URL"
                  className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="Github URL"
                  className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder="Tech Stack"
                  className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
                />
              </div>
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
export default Onboarding;
