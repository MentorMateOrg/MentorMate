import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/search?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      navigate("/search-results", { state: { results: data } });
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a Mentor/Mentee by name or skill"
        className="border border-purple-600 rounded px-4 py-2 w-72 text-center"
      />
      <button
        onClick={handleSearch}
        className="bg-purple-500 text-white px-8 py-2 rounded-md hover:bg-purple-600 text-sm ml-4"
      >
        Search
      </button>
    </div>
  );
}

export default SearchBox;
