

import { useState } from 'react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-brown-600 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <div className="text-xl font-bold">MyApp</div>

        {/* Menu Icon (Mobile) */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>

        {/* Links */}
        <ul className={`flex flex-col md:flex-row md:flex ${isOpen ? 'block' : 'hidden'} absolute md:static top-16 left-0 w-full md:w-auto bg-blue-600 md:bg-transparent`}>
          <li className="p-4 hover:bg-black-700 md:hover:bg-transparent"><a href="/">Home</a></li>
          <li className="p-4 hover:bg-blue-700 md:hover:bg-transparent"><a href="/about">About</a></li>
          <li className="p-4 hover:bg-blue-700 md:hover:bg-transparent"><a href="/contact">Contact</a></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
