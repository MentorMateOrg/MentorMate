import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const navigation = {
  DASHBBOARD: "Dashboard",
  PROFILE: "Profile",
  CONNECTION_REQUESTS: "Connection Requests",
};

function Navbar({ handleLogOut }) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  return (
    <>
      <nav className="px-2 sm:px-4 py-2.5 text-white flex justify-between">
        <h2 className="flex items-end text-2xl font-bold text-purple-500">
          MentorMate
        </h2>
        <div className="flex items-center justify-end text-white">
          <Link
            to={"/profile"}
            className="hover:text-gray-700 bg-purple-500 py-2 px-4 rounded-xl mr-4 "
          >
            {navigation.PROFILE}
          </Link>
          <Link
            to={"/dashboard"}
            className="hover:text-gray-700 bg-purple-500 py-2 px-4 rounded-xl"
          >
            {navigation.DASHBBOARD}
          </Link>
          <button
            className="ml-4 text-black bg-gray-100 py-2 px-4 rounded-xl"
            onClick={handleLogOut}
          >
            Log Out
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
