import React from "react";
import applyOperations from "../utils/applyOperations";

function VersionSidebar({ setEditorCode, onClose, versions = [] }) {
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
    <div className="w-1/5 border-l bg-white flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-bold text-lg">
          Version History
        </h2>
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

export default VersionSidebar;
