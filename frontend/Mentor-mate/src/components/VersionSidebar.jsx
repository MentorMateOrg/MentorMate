import React, { useEffect, useState } from "react";
import VersionPreviewPopup from "./VersionPreviewPopup";

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
  const [previewVersionId, setPreviewVersionId] = useState(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);

  useEffect(() => {
    if (!roomId || !socket) return;

    setLoading(true);
    setError(null);

    // Request version history from server
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

    // Listen for new versions being saved
    const handleVersionSaved = (data) => {
      // Refresh version history when a new version is saved
      socket.emit("get-version-history", roomId);
    };

    socket.on("version-history", handleVersionHistory);
    socket.on("error", handleError);
    socket.on("version-applied", handleVersionApplied);
    socket.on("version-saved", handleVersionSaved);

    return () => {
      socket.off("version-history", handleVersionHistory);
      socket.off("error", handleError);
      socket.off("version-applied", handleVersionApplied);
      socket.off("version-saved", handleVersionSaved);
    };
  }, [roomId, socket]);

  const handleVersionClick = (versionId) => {
    setPreviewVersionId(versionId);
    setShowPreviewPopup(true);
  };

  const handleApplyVersion = (versionId) => {
    if (!socket) return;

    setSelectedVersionId(versionId);
    socket.emit("apply-version", { roomId, versionId });
    setShowPreviewPopup(false);
  };

  const handleClosePreview = () => {
    setShowPreviewPopup(false);
    setPreviewVersionId(null);
  };

  return (
    <>
      <div className="w-72 border-l bg-gray-50 flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h2 className="font-bold text-lg">Version History</h2>
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
          {loading && (
            <div className="text-sm text-gray-500 text-center py-4">
              Loading versions...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 text-center py-4">
              Error: {error}
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">
              No versions saved yet
            </div>
          )}

          {!loading &&
            !error &&
            Array.isArray(versions) &&
            versions.length > 0 && (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.versionId}
                    className={`cursor-pointer p-3 rounded-md border transition-all duration-150 ${
                      selectedVersionId === version.versionId
                        ? "bg-blue-100 border-blue-300"
                        : "bg-white hover:bg-gray-100 border-gray-200 hover:shadow-sm"
                    }`}
                    onClick={() => handleVersionClick(version.versionId)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {version.user?.profile?.full_name ||
                          version.author ||
                          "Unknown User"}
                      </p>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Preview
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(version.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <VersionPreviewPopup
        isOpen={showPreviewPopup}
        onClose={handleClosePreview}
        versionId={previewVersionId}
        roomId={roomId}
        socket={socket}
        onApply={handleApplyVersion}
      />
    </>
  );
}
