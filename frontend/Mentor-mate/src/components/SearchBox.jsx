import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/search?query=${query}`,
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
        placeholder="Search by name or skill"
        className="border rounded px-4 py-2"
      />
      <button
        onClick={handleSearch}
        className="ml-2 bg-purple-500 text-white px-4 py-2 rounded"
      >
        Search
      </button>
    </div>
  );
}

export default SearchBox;
