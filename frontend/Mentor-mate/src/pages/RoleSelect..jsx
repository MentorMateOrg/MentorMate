import { useNavigate } from "react-router-dom";

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    localStorage.setItem("role", role);
    navigate("/onboarding");
  };

  return (
    <>
      <div className="flex min-h-screen  items-center justify-center ">
        <div className="">
          <h3 className="text-3xl font-bold mb-8">Mission Statement</h3>
          <p>
            Our mentorship platform bridges the gap between aspiring
            professionals and experienced mentors by fostering meaningful,
            goal-driven connections. <br />
            We aim to empower learners with personalized guidance, real-world
            insights, and supportive relationships that accelerate growth and
            career success.
          </p>
          <button onClick={() => handleRoleSelect("MENTEE")} className="mr-4">
            Look for a Mentor
          </button>
          <button onClick={() => handleRoleSelect("MENTOR")} className="mr-4">
            Become a Mentor
          </button>
        </div>
      </div>
    </>
  );
}
