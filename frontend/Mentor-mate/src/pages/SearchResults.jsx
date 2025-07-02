// SearchResults.jsx
import React from "react";
import { useLocation } from "react-router-dom";

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
              <h2 className="text-xl font-semibold">
                {user.profile.full_name}
              </h2>
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
