import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import LiveCodingEditor from "../pages/LiveCodingEditor";

const navigation = {
  DASHBBOARD: "Dashboard",
  PROFILE: "Profile",
  CONNECTION_REQUESTS: "Connection Requests",
  GROUP_MENTORSHIP: "Group Mentorship",
};

function Navbar() {
  const navigate = useNavigate();
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const handleLogOut = () => {
    localStorage.removeItem("token");
    // Trigger a custom event to clear user data
    window.dispatchEvent(new Event("userLogout"));
    navigate("/login");
  };

  return (
    <>
      <nav className="px-2 sm:px-4 py-2.5 text-white bg-purple-500 flex justify-between shadow-lg">
        <h2 className="flex items-end text-2xl font-bold">MentorMate</h2>
        <div className="flex items-center justify-end text-white gap-3">
          <Link
            to={"/profile"}
            className="bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/30"
          >
            {navigation.PROFILE}
          </Link>
          <Link
            to={"/dashboard"}
            className="bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/30"
          >
            {navigation.DASHBBOARD}
          </Link>
          <Link
            to={"/group-mentorship"}
            className="bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/30"
          >
            {navigation.GROUP_MENTORSHIP}
          </Link>
          <button
            onClick={() => setShowCodeEditor(true)}
            className="bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium border border-white/20 hover:border-white/30"
          >
            Code Editor
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium border border-red-600 hover:border-red-700 shadow-md"
            onClick={handleLogOut}
          >
            Log Out
          </button>
        </div>
      </nav>

      {showCodeEditor && (
        <LiveCodingEditor
          isOpen={showCodeEditor}
          onClose={() => setShowCodeEditor(false)}
        />
      )}
    </>
  );
}

export default Navbar;
