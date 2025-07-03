

import React, { useState, useEffect } from "react";

export default function Connections() {
  const [requests, setRequests] = useState([]);

  const sendRequest = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/connection/connection-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ receiverId: user.id }),
        }
      );
      if (response.ok) {
        alert("Connection request sent!");
      } else {
        alert("Failed to send request");
      }
    } catch (err) {
      alert("Error sending request:", err);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/connection/connection-requests",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setRequests(data);
      } catch (err) {
        alert("Error fetching requests:", err);
      }
    };

    fetchRequests();
  }, []);

  return (
    <>
      <div className="flex gap-4 mt-4 justify-center md:justify-start">
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
          onClick={sendRequest}
        >
          Connect
        </button>
      </div>
      <h1>Connections</h1>
      {/* Connection Requests */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Connection Requests</h2>
        <ul className="space-y-2 text-gray-700">
          {requests.length === 0 ? (
            <li>No connection requests yet.</li>
          ) : (
            requests.map((request) => (
              <li key={request.id} className="border-b pb-2">
                <span className="font-medium">{request.sender.email}</span>{" "}
                wants to connect with{" "}
                <span className="font-medium">
                  {request.receiver.full_name}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
