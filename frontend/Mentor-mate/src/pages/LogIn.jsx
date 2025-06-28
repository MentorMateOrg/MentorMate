import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogIn = async (form) => {
    form.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, plainPassword: password }),
    });
    const user = await response.json();
    if (response.ok) {
      navigate("/dashboard");
    } else {
      alert("You are not registered! Please sign up");
    }
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="">
          <form onSubmit={handleLogIn}>
            <h1 className="mb-4">Log In</h1>
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
            <button className="mt-4">Log In</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default LogIn;
