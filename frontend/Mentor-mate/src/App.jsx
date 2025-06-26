import { useState } from "react";
import "./App.css";
import SignUp from "./pages/SignUp";
import Welcome from "./pages/Welcome";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from "./pages/LogIn";
import Onboarding from "./pages/Onboarding";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
