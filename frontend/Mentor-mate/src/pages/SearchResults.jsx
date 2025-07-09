// SearchResults.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  const { results } = location.state || { results: [] };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      {results.length > 0 ? (
        <ul className="space-y-4">
          {results.map((user) => (
            <li key={user.id} className="bg-white p-4 rounded shadow">
              <Link
                to={`/profile/${user.id}`}
                className="text-xl font-semibold text-purple-600 hover:text-purple-800 hover:underline"
              >
                {user.profile.full_name}
              </Link>
              <p>Skills: {user.profile.interests.join(", ")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
}

export default SearchResults;
