import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import { jwtDecode } from "jwt-decode";

const SOCKET_URL = "http://localhost:5000";
const DEFAULT_LANGUAGE = "javascript";
const EDITOR_THEME = "vs-dark";
const DEBOUNCE_DELAY = 300;

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
];

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
    const token = localStorage.getItem("token");
    let fullName = "Anonymous";
    if (token) {
      const decoded = jwtDecode(token);
      fullName = decoded.fullName;
    }
    if (socket && roomId.trim() && token) {
      socket.emit("join-room", roomId.trim(), token, fullName);
    } else {
      alert("You must logged in to join a room");
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

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket && isConnected) {
      socket.emit("language-change", { language: newLanguage, userId });
    }
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { text: "Disconnected", color: "text-red-500" };
    if (connectedUsers.length === 0)
      return { text: "Connected", color: "text-yellow-500" };
    return { text: "Collaborating", color: "text-green-500" };
  };

  const connectionStatus = getConnectionStatus();

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
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">
                  Live Collaborative Code Editor
                </h1>
                <span
                  className={`text-sm font-medium ${connectionStatus.color}`}
                >
                  ● {connectionStatus.text}
                </span>
              </div>
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
                <button
                  onClick={joinRoom}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Join Room
                </button>
              </div>
            ) : (
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Room: {roomId}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Language:</span>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="border px-2 py-1 rounded text-sm"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Active Users:</span>
                  <div className="flex gap-1">
                    {connectedUsers.map((fullName, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                      >
                        {fullName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                  scrollBeyondLastLine: false,
                  renderWhitespace: "selection",
                  tabSize: 2,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
