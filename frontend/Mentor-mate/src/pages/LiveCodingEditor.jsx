import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function LiveCodingEditor() {
  const [socket, setSocket] = useState(null);
  const [codingEditor, setCodingEditor] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("message", (text) => {
      setMessages((prevMessages) => [...prevMessages, text]);
    });

    newSocket.on("connect", (id) => {
      setMessages((prevMessages) => [...prevMessages, "Connected"]);
    });
    return () => newSocket.close();
  }, []);

  const sendMessage = () => {
    if (socket && inputValue.trim()) {
      socket.emit("message", inputValue);
      setInputValue("");
    }


  };

  return (
    <>
      <button onClick={() => setCodingEditor(true)}>Code</button>
      {codingEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-white">
          <div>
            <h1>Live Coding Editor</h1>
            <ul className="message-list">
              {messages.map((message, index) => (
                <li key={index} className="message-item">
                  {message}
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Enter your message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="message-input"
            />
            <button onClick={sendMessage}>Save</button>
            <button
              onClick={() => setCodingEditor(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close Editor
            </button>
          </div>
        </div>
      )}
    </>
  );
}
