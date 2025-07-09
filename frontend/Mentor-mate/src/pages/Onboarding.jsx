import React, { useState, useEffect } from "react";
import MentorOnboarding from "./MentorOnboarding";
import MenteeOnboarding from "./MenteeOnboarding";

const Onboarding = ({ role, setRole }) => {

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <div>
            {role === "MENTEE"
              ? <MenteeOnboarding role = {role} setRole = {setRole} />
              : <MentorOnboarding role = {role} setRole = {setRole} />}
          </div>
        </div>
      </div>
    </>
  );
};
export default Onboarding;
