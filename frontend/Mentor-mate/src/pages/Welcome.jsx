import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MentorMatelogo from "../assets/images/MentorMatelogo.jpg";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full text-center">
        <img src = {MentorMatelogo} alt="MentorMate Logo" className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-purle-500"/>
          <h1 className="text-3xl font-bold text-purple-700 mb-4">Welcome to MentorMate! 🎉</h1>
          <p className="mb-6 text-gray-600 text-lg">Find the right mentor here. Start growing together!</p>
          <div className="flex justify-center gap-4">
          <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition" onClick={handleSignUp}>
            Sign Up
          </button>
          <button className="border border-purple-600 text-purple-600 px-6 py-2 rounded hover:bg-purple-100 transition" onClick={handleLogIn}>Log In</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Welcome;
