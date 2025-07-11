import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const SOCKET_URL = "http://localhost:5000";
const DEFAULT_LANGUAGE = "javascript";
const EDITOR_THEME = "vs-dark";
const DEBOUNCE_DELAY = 300;

export default function LiveCodingEditor() {
  const [socket, setSocket] = useState(null);
  const [codingEditor, setCodingEditor] = useState(false);
  const [code, setCode] = useState(
    "// Welcome to collaborative coding!\n// Start typing to see real-time updates"
  );
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [roomId, setRoomId] = useState("");
  const [userId, setUserId] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!codingEditor) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("room-state", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setConnectedUsers(data.users);
    });

    newSocket.on("code-update", (data) => {
      setCode(data.code);
    });

    newSocket.on("language-update", (data) => {
      setLanguage(data.language);
    });

    newSocket.on("user-joined", (data) => {
      setConnectedUsers(data.users);
    });

    newSocket.on("user-left", (data) => {
      setConnectedUsers(data.users);
    });

    newSocket.on("room-error", (data) => {
      alert(`Room Error: ${data.error}`);
    });

    return () => {
      newSocket.close();
      setIsConnected(false);
    };
  }, [codingEditor]);

  const joinRoom = () => {
    if (socket && roomId.trim() && userId.trim()) {
      socket.emit("join-room", roomId.trim(), userId.trim());
    }
  };

  const handleCodeChange = (value) => {
    setCode(value || "");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (socket && isConnected) {
        socket.emit("code-change", { code: value || "", userId });
      }
    }, DEBOUNCE_DELAY);
  };

  return (
    <>
      <button
        onClick={() => setCodingEditor(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Open Code Editor
      </button>
      {codingEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold">
                Live Collaborative Code Editor
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm">Users: {connectedUsers.length}</span>
                <button
                  onClick={() => setCodingEditor(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Close
                </button>
              </div>
            </div>

            {!isConnected || connectedUsers.length === 0 ? (
              <div className="p-4 flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="border px-3 py-2 rounded"
                />
                <button
                  onClick={joinRoom}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Join Room
                </button>
              </div>
            ) : null}

            <div className="flex-1 p-4">
              <Editor
                height="100%"
                language={language}
                value={code}
                theme={EDITOR_THEME}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
