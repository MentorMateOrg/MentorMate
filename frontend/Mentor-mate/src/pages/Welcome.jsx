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
      <h1>Welcome to MentorMate! 🎉</h1>
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={handleLogIn}>Log In</button>
    </>
  );
}

export default Welcome;
