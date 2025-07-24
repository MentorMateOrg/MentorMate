import React, { useState, useEffect } from "react";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import RoleSelect from "./pages/RoleSelect.";
import SearchResults from "./pages/SearchResults";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { InteractiveCursor } from "./components/CursorEffects";
import { FullPageLoader } from "./components/LoadingSpinner";

const steps = {
  SIGNUP: 1,
  ROLESELECT: 2,
  ONBOARDING: 3,
};

function stepper({ step }) {
  return (
    <div className="relative flex justify-around mb-8">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600 z-0" />
      {Object.entries(steps).map(([key, value]) => (
        <div key={key} className="flex iems-center">
          <div
            className={`z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
              step === value
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-300"
            }`}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PagesContainer() {
  const [role, setRole] = useState("");
  const [user, setUser] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser("");
      setIsInitialLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
      } else {
        localStorage.removeItem("token");
        setUser("");
      }
    } catch (err) {
      localStorage.removeItem("token");
      setUser("");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen for storage changes and login events to refresh user data
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };

    const handleUserLogin = () => {
      fetchUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogin", handleUserLogin);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogin", handleUserLogin);
    };
  }, []);

  if (isInitialLoading) {
    return <FullPageLoader text="Loading MentorMate..." />;
  }

  return (
    <>
      <InteractiveCursor />
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route
            path="/signup"
            element={<SignUp stepper={() => stepper({ step: steps.SIGNUP })} />}
          />
          <Route
            path="/login"
            element={
              <LogIn stepper={() => stepper({ step: steps.ONBOARDING })} />
            }
          />
          <Route
            path="/onboarding"
            element={<Onboarding role={role} setRole={setRole} />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/roleselect"
            element={
              <RoleSelect
                stepper={() => stepper({ step: steps.ROLESELECT })}
                role={role}
                setRole={setRole}
              />
            }
          />
          <Route path="/search-results" element={<SearchResults />} />
          <Route
            path="/profile"
            element={<Profile user={user} setUser={setUser} />}
          />
          <Route path="/profile/:userId" element={<UserProfile />} />
        </Routes>
      </Router>
    </>
  );
}
