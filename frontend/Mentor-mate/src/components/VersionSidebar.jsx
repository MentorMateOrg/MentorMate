
import React, { useEffect, useState } from "react";
import axios from "axios";
import { applyOperations } from "../constants/operationTypes";

export default function VersionSidebar({
  roomId,
  baseCode,
  setEditorCode,
  onClose,
  socket,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  useEffect(() => {
    if (!roomId || !socket) return;

    setLoading(true);
    setError(null);
    //Request version history from server
    socket.emit("get-version-history", roomId);

    // Listen for version history response
    const handleVersionHistory = (data) => {
      if (Array.isArray(data.versions)) {
        setVersions(data.versions);
      } else {
        setVersions([]);
      }
      setLoading(false);
    };

    // Listen for errors
    const handleError = (data) => {
      setError(data.message || "An error occurred");
      setLoading(false);
    };

    // Listen for version applied event
    const handleVersionApplied = (data) => {
      setSelectedVersionId(data.versionId);
    };

    socket.on("version-history", handleVersionHistory);
    socket.on("error", handleError);
    socket.on("version-applied", handleVersionApplied);

    return () => {
      socket.off("version-history", handleVersionHistory);
      socket.off("error", handleError);
      socket.off("version-applied", handleVersionApplied);
    };
  }, [roomId, socket]);

  const applyVersion = (versionId) => {
    if (!socket) return;

    setSelectedVersionId(versionId);
    socket.emit("apply-version", { roomId, versionId });
  };

  const resolveConflict = (version1Id, version2Id) => {
    if (!socket) return;

    socket.emit("resolve-conflict", { roomId, version1Id, version2Id });
  };

  return (
    <div className="p-4 border-r w-72 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold">Version History</h2>
        {onClose && (
          <button
            onClick={onClose}
             className="text-gray-500 hover:text-gray-700 text-xl p-1 hover:bg-gray-100 rounded"
            aria-label="Close version sidebar"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
      {versions.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No versions found
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <div className="text-sm text-gray-500">No versions found</div>
      )}

      {!loading && !error && Array.isArray(versions) && versions.length > 0 && (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.versionId}
              className={`cursor-pointer p-2 rounded ${
                selectedVersionId === v.versionId
                  ? "bg-blue-100 border border-blue-300"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => applyVersion(v.versionId)}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">
                  {v.user?.profile?.full_name || "Unknown User"}
                </p>
                {selectedVersionId && selectedVersionId !== v.versionId && (
                  <button
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      resolveConflict(selectedVersionId, v.versionId);
                    }}
                  >
                    Merge
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {new Date(v.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.isArray(versions) &&
          versions.length > 0 &&
          versions.map((v) => (
            <div
              key={v.versionId}
             className="cursor-pointer hover:bg-gray-100 active:bg-gray-200 p-3 rounded-md border border-transparent hover:border-gray-200 transition-all duration-150"
              onClick={() => reconstructVersion(v.versionId)}
            >
              <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                {v.author}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(v.timestamp).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
          </div>
      </div>

    </div>
  );
}


