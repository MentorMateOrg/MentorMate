import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-purple-400 mb-4">
              MentorMate
            </h3>
            <p className="text-gray-300 mb-4">
              Connecting mentors and mentees for meaningful learning
              experiences. Build skills, share knowledge, and grow together in
              our collaborative community.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                <span className="sr-only">GitHub</span>
                💻
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                💼
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-purple-400 transition-colors"
              >
                <span className="sr-only">Twitter</span>
                🐦
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/dashboard"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Profile
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Find Mentors
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-purple-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} MentorMate. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Made with ❤️ for the mentoring community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
