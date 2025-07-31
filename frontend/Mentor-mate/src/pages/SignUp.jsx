import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";
import LoadingSpinner from "../components/LoadingSpinner";

function SignUp({ stepper }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignUp = async (form) => {
    form.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, plainPassword: password }),
      });
      const user = await response.json();
      if (response.ok) {
        const token = user.token;
        localStorage.setItem("token", token);
        navigate("/roleselect");
      } else {
        alert("Error signing up");
      }
    } catch (err) {
      alert("Sign up error: ", err);
    } finally {
      setIsLoading(false);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <>
      <div className="flex items-center bg-gradient-to-br from-purple-50 to-white justify-center min-h-screen bg-gray-50">
        <div className="bg-white shadow-lg rounded-xl px-8 py-10 w-full max-w-md">
          <form onSubmit={handleSignUp}>
            <h1 className="mb-4 text-2xl font-bold text-center">
              Create an account
            </h1>
            <p className="mb-4 text-center text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-semibold">
                Log in
              </Link>
            </p>
            {stepper()}
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
              className={`w-full py-2 rounded-lg font-semibold border border-gray-300 flex items-center justify-center ${
                email && password && !isLoading
                  ? "bg-white text-gray-500 hover:border-purple-600 cursor-pointer"
                  : "bg-white text-gray-300 cursor-not-allowed"
              }`}
              disabled={!(email && password) || isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" color="purple" />
                  <span className="ml-2">Creating Account...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUp;
