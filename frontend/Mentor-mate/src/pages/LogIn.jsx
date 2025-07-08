import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogIn = async (form) => {
    form.preventDefault();

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, plainPassword: password }),
    });
    const data = await response.json();
    if (response.ok) {
      // Store the token in localStorage
      localStorage.setItem("token", data.token);
      // Trigger a custom event to refresh user data
      window.dispatchEvent(new Event("userLogin"));
      navigate("/dashboard");
    } else {
      alert("You are not registered! Please sign up");
    }
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 w-full max-w-md">
          <form onSubmit={handleLogIn}>
            <h1 className="mb-4 text-2xl font-bold text-center">Log In</h1>
            <div>
              <label htmlFor="email" className="block font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full py-2 px-4 border border-gray-300 rounded-lg mb-4"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full py-2 px-4 border border-gray-300 rounded-lg mb-4"
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2 rounded-lg font-semibold border border-gray-300 mb-4 ${
                email && password
                  ? "bg-white text-gray-500 hover:border-purple-600 cursor-pointer"
                  : "bg-white text-gray-300 cursor-not-allowed"
              }`}
              disabled={!(email && password)}
            >
              Login
            </button>
            <p className="mb-4 text-center text-gray-500">
              Don't have an account?{" "}
              <a href="/signup" className="text-purple-600 font-semibold">
                Sign Up
              </a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

export default LogIn;
