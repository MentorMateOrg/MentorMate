import { useState } from "react";
import "./App.css";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import RoleSelect from "./pages/RoleSelect.";
import Profile from "./pages/Profile";

function stepper({ step }) {
  return (
    <div className="flex justify-around mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex iems-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
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

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp stepper={stepper} />} />
          <Route path="/login" element={<LogIn stepper={stepper} />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/roleselect" element={<RoleSelect />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
