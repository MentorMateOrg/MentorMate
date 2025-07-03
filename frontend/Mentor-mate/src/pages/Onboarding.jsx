import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Dashboard from "./Dashboard";
import MentorOnboarding from "./MentorOnboarding";
import MenteeOnbaording from "./MenteeOnbaording";

const Onboarding = ({ role, setRole }) => {

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <div>
            {role === "MENTEE"
              ? <MenteeOnbaording role = {role} setRole = {setRole} />
              : <MentorOnboarding role = {role} setRole = {setRole} />}
          </div>
        </div>
      </div>
    </>
  );
};
export default Onboarding;
