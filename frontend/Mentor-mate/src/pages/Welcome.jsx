import { useNavigate } from "react-router-dom";
import logo from "../assets/images/MentorMateLogo.jpg";
import Navbar from "../components/Navbar";

function Welcome() {
  const navigate = useNavigate();
  function handleSignUp() {
    navigate("/signup");
  }

  function handleLogIn() {
    navigate("/login");
  }
  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="mb-4">Welcome to MentorMate! 🎉</h1>
          <p className="mb-4 text-2xl">Find Your right mentor here!</p>
          <button className="mr-2" onClick={handleSignUp}>
            Sign Up
          </button>
          <button onClick={handleLogIn}>Log In</button>
        </div>
      </div>
    </>
  );
}

export default Welcome;
