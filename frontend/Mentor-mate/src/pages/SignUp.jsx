import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Onboarding from "./Onboarding";
import Navbar from "../components/Navbar";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (form) => {
    form.preventDefault();

    const response = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, plainPassword: password }),
    });
    const user = await response.json();
    if (response.ok) {
      const token = user.token;
      localStorage.setItem("token", token);
      navigate("/onboarding");
    } else {
      alert("Error signing up: ");
    }
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <form onSubmit={handleSignUp}>
            <h1 className="mb-4">Sign Up</h1>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="pt-2 pb-2 pl-4 pr-4 m-2 border border-gray-300"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="p-2 m-2 border border-gray-300"
              />
            </div>
            <button className="mt-4">Sign Up</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUp;
