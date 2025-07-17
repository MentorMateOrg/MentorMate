import React, { useEffect, useState } from "react";
import axios from "axios";

// Frontend version of applyOperations function
const applyOperations = (baseCode, operations) => {
  const DELETE = "delete";
  const INSERT = "insert";
  let result = baseCode;
  for (const op of operations) {
    if (op.type === DELETE) {
      result = result.slice(0, op.pos) + result.slice(op.pos + op.length);
    } else if (op.type === INSERT) {
      result = result.slice(0, op.pos) + op.text + result.slice(op.pos);
    }
  }
  return result;
};

export default function VersionSidebar({
  roomId,
  baseCode,
  setEditorCode,
  onClose,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    axios
      .get(`http://localhost:5000/api/rooms/${roomId}/history`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setVersions(res.data);
        } else {
          setVersions([]);
        }
      })
      .catch(() => {
        setError("Failed to load version history");
        setVersions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roomId]);

  const reconstructVersion = (versionId) => {
    // Start with the initial base code (welcome message)
    let code =
      "// Welcome to collaborative coding!\n// Start typing to see real-time updates";
    const versionChain = [];

    // Build the chain from root to the selected version
    let current = versions.find((v) => v.versionId === versionId);
    while (current) {
      versionChain.unshift(current);
      current = versions.find((v) => v.versionId === current.parentId);
    }

    // Apply operations in chronological order
    for (const change of versionChain) {
      code = applyOperations(code, change.operations);
    }

    setEditorCode(code);
  };

  return (
    <div className="p-4 border-r w-60 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Version History</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Loading versions...</div>
      )}

      {error && (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <div className="text-sm text-gray-500">No versions found</div>
      )}

      {!loading &&
        !error &&
        Array.isArray(versions) &&
        versions.length > 0 &&
        versions.map((v) => (
          <div
            key={v.versionId}
            className="cursor-pointer hover:bg-gray-100 p-2 rounded"
            onClick={() => reconstructVersion(v.versionId)}
          >
            <p className="text-sm font-medium">{v.author}</p>
            <p className="text-xs text-gray-500">
              {new Date(v.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
    </div>
  );
}
