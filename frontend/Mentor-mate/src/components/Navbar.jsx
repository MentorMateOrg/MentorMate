import { useState } from "react";
import { useNavigate } from "react-router-dom";




const navigation = {
DASHBBOARD: "Dashboard",
PROFILE: "Profile",
CONNECTION_REQUESTS: "Connection Requests",

}



function Navbar({handleLogOut}) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();



  return (
    <>
      <nav className="bg-gray-800 px-2 sm:px-4 py-2.5 text-white">
    <div className="flex  items-center justify-end">

    <a className="hover:text-gray-500">{navigation.PROFILE}</a>

        <a className=" hover:text-gray-500 ml-4">{navigation.DASHBBOARD}</a>
        <button className = "ml-4 text-black" onClick={handleLogOut}>Log Out</button>
        </div>

      </nav>
    </>
  );
}

export default Navbar;
