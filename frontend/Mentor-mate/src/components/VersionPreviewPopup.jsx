import React, { useEffect, useState } from "react";

export default function VersionPreviewPopup({
  isOpen,
  onClose,
  versionId,
  roomId,
  socket,
  onApply,
}) {
  const [versionData, setVersionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !versionId || !socket) return;

    setLoading(true);
    setError(null);
    setVersionData(null);

    // Request version changes from server
    socket.emit("get-version-changes", { roomId, versionId });

    // Listen for version changes response
    const handleVersionChanges = (data) => {
      if (data.versionId === versionId) {
        setVersionData(data);
        setLoading(false);
      }
    };

    // Listen for errors
    const handleError = (data) => {
      setError(data.message || "Failed to load version changes");
      setLoading(false);
    };

    socket.on("version-changes", handleVersionChanges);
    socket.on("error", handleError);

    return () => {
      socket.off("version-changes", handleVersionChanges);
      socket.off("error", handleError);
    };
  }, [isOpen, versionId, roomId, socket]);

  const handleApply = () => {
    if (versionData && onApply) {
      onApply(versionId);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-4/5 h-4/5 flex flex-col max-w-4xl">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold">Version Preview</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-xl p-1 hover:bg-gray-200 rounded"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading version changes...</div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-500">Error: {error}</div>
            </div>
          )}

          {versionData && !loading && !error && (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      Author: {versionData.author}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(versionData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex">
                <div className="w-1/2 border-r flex flex-col">
                  <div className="p-3 bg-red-50 border-b">
                    <h3 className="font-medium text-red-800">Current Code</h3>
                    <p className="text-xs text-red-600 mt-1">
                      What's currently in the editor
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-50">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-white m-2 rounded border">
                      {versionData.currentCode}
                    </pre>
                  </div>
                </div>

                <div className="w-1/2 flex flex-col">
                  <div className="p-3 bg-green-50 border-b">
                    <h3 className="font-medium text-green-800">Version Code</h3>
                    <p className="text-xs text-green-600 mt-1">
                      What will be applied if you click "Apply Version"
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-50">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-white m-2 rounded border">
                      {versionData.versionCode}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!versionData || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Apply Version
          </button>
        </div>
      </div>
    </div>
  );
}
