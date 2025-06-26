import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      alert("You are logged in!");
    } else {
      alert("Error signing up: because of whatever reason");
    }
  };
  return (
    <>
      <div>
        <form onSubmit={handleOnboarding}>
          <h2>Onboarding</h2>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
          />
          <input
            type="text"
            value={profilePicUrl}
            onChange={(e) => setProfilePicUrl(e.target.value)}
            placeholder="Profile Picture URL"
          />
          <input
            type="text"
            value={linkedInUrl}
            onChange={(e) => setLinkedInUrl(e.target.value)}
            placeholder="LinkedIn URL"
          />
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="Github URL"
          />
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="Tech Stack"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
};
export default Onboarding;
