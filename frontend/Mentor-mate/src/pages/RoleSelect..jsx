import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleSelect({ stepper, role, setRole }) {
  const navigate = useNavigate();

  const handleMenteeSelect = () => {
    setRole("MENTEE");
    navigate("/onboarding");
  };

  const handleMentorSelect = () => {
    setRole("MENTOR");
    navigate("/onboarding");
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          {stepper({ step: 2 })}
          <h3 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">
            Empowering Growth through Mentorship
          </h3>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Our mentorship platform bridges the gap between aspiring
            professionals and experienced mentors by fostering meaningful,
            goal-driven connections. <br className="hidden sm:block" />
            We aim to empower learners with personalized guidance, real-world
            insights, and supportive relationships that accelerate growth and
            career success.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => handleMenteeSelect()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full transition"
            >
              Look for a Mentor
            </button>
            <button
              onClick={() => handleMentorSelect()}
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold py-3 px-8 rounded-full transition"
            >
              Become a Mentor
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
