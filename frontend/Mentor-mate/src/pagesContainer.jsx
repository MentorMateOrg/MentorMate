import React, { useState } from "react";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import RoleSelect from "./pages/RoleSelect.";
import Profile from "./pages/Profile";
import SearchResults from "./pages/SearchResults";

function stepper({ step }) {
  return (
    <div className="relative flex justify-around mb-8">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600 z-0" />
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex iems-center">
          <div
            className={`z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
              step === s ? "bg-purple-600 text-white" : "bg-white text-gray-300"
            }`}
          >
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PagesContainer() {
  const [role, setRole] = useState("");

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp stepper={stepper} />} />
          <Route path="/login" element={<LogIn stepper={stepper} />} />
          <Route
            path="/onboarding"
            element={<Onboarding role={role} setRole={setRole} />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/roleselect"
            element={
              <RoleSelect stepper={stepper} role={role} setRole={setRole} />
            }
          />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </>
  );
}
