

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Connections({ targetUser }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const sendRequest = async () => {
    if (!targetUser) {
      alert("No user selected to connect with");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/connection/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ receiverId: targetUser.id }),
        }
      );
      if (response.ok) {
        alert("Connection request sent!");
      } else {
        const errorData = await response.json();
        alert(`Failed to send request: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error sending request:", err);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/connection/requests/${requestId}/accept`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        alert("Connection request accepted!");
        // Refresh the data
        fetchPendingRequests();
        fetchConnections();
      } else {
        const errorData = await response.json();
        alert(`Failed to accept request: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error accepting request:", err);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/connection/requests/${requestId}/reject`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        alert("Connection request rejected!");
        // Refresh the pending requests
        fetchPendingRequests();
      } else {
        const errorData = await response.json();
        alert(`Failed to reject request: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error rejecting request:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/connection/requests/pending",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setPendingRequests(data);
    } catch (err) {
      alert("Error fetching pending requests:", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/connection/connections",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      alert("Error fetching connections:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingRequests(), fetchConnections()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading connections...</div>;
  }

  return (
    <>
      {/* Connect Button - only show when viewing someone else's profile */}
      {targetUser && (
        <div className="flex gap-4 mt-4 justify-center md:justify-start">
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
            onClick={sendRequest}
          >
            Connect
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Pending Connection Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Pending Connection Requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending connection requests.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                  <Link to={`/profile/${request.sender.id}`}>
                    <img
                      src={request.sender.profile?.profilePicUrl || "https://static.vecteezy.com/system/resources/previews/055/581/121/non_2x/default-profile-picture-icon-avatar-photo-placeholder-illustration-vector.jpg"}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{request.sender.profile?.full_name || request.sender.email}</p>
                      <p className="text-sm text-gray-500">{request.sender.profile?.role || "User"}</p>
                    </div>
                    </Link>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptRequest(request.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(request.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Connections */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">My Connections</h2>
          {connections.length === 0 ? (
            <p className="text-gray-500">No connections yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <div key={connection.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Link to={`/profile/${connection.connectedUser.id}`}>
                  <img
                    src={connection.connectedUser.profile?.profilePicUrl || "https://static.vecteezy.com/system/resources/previews/055/581/121/non_2x/default-profile-picture-icon-avatar-photo-placeholder-illustration-vector.jpg"}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{connection.connectedUser.profile?.full_name || connection.connectedUser.email}</p>
                    <p className="text-sm text-gray-500">{connection.connectedUser.profile?.role || "User"}</p>
                    <p className="text-xs text-gray-400">
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
