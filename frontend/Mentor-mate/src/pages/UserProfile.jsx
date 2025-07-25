import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import GithubActivity from "../components/GithubActivity";
import { API_URL } from "../config";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [full_name, setFullName] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [experiences, setExperiences] = useState([]);
  const [interests, setInterests] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null); // null, 'pending', 'connected', 'none'

  // Check if this is the user's own profile (no userId param means own profile)
  const isOwnProfile = !userId;

  const fetchUser = async () => {
    setLoading(true);
    try {
      let response;
      if (isOwnProfile) {
        // Fetch current user's profile
        response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        // Fetch specific user's profile
        response = await fetch(`${API_URL}/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        // Set editing states for own profile
        if (isOwnProfile && data.profile) {
          setBio(data.profile.bio || "");
          setFullName(data.profile.full_name || "");
          setProfilePicUrl(data.profile.profilePicUrl || "");
          setExperiences(data.profile.experiences || []);
          setInterests(data.profile.interests || []);
        }
      } else {
        alert("User not found");
      }
    } catch (error) {
      alert("Error fetching user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    if (!isOwnProfile) {
      checkConnectionStatus();
    }
  }, [userId, isOwnProfile]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/connections/requests",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const requests = await response.json();
        const currentUserId = JSON.parse(
          atob(localStorage.getItem("token").split(".")[1])
        ).id;

        // Check if there's already a connection request between users
        const existingRequest = requests.find(
          (request) =>
            (request.senderId === currentUserId &&
              request.receiverId === parseInt(userId)) ||
            (request.receiverId === currentUserId &&
              request.senderId === parseInt(userId))
        );

        if (existingRequest) {
          if (existingRequest.status === "ACCEPTED") {
            setConnectionStatus("connected");
          } else if (existingRequest.status === "PENDING") {
            setConnectionStatus("pending");
          } else {
            setConnectionStatus("none");
          }
        } else {
          setConnectionStatus("none");
        }
      }
    } catch (error) {
      setConnectionStatus("none");
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/connections/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            receiverId: parseInt(userId),
          }),
        }
      );

      if (response.ok) {
        setConnectionStatus("pending");
        alert("Connection request sent successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to send connection request: ${errorData.message}`);
      }
    } catch (error) {
      alert("Error sending connection request");
    }
  };

  const handleSaveBio = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          full_name,
          bio,
          profilePicUrl,
          interests,
          experiences,
          githubUrl: user.profile.githubUrl,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setUser((prev) => ({ ...prev, profile: data.profile }));
        setIsEditingBio(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      alert("Error updating profile");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !user.profile) {
    return <div>User not found</div>;
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-md p-6 mb-8">
          {user.profile.profilePicUrl ? (
            <img
              src={user.profile.profilePicUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-2 border-purple-500"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-300 border-2 border-purple-500 flex items-center justify-center">
              <span className="text-gray-600 text-2xl font-semibold">
                {user.profile.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="ml-0 md:ml-6 text-center md:text-left mt-4 md:mt-0">
            <h2 className="text-2xl font-semibold">{user.profile.full_name}</h2>
            <p className="text-gray-500">
              {user.profile.role || "Role not added"}
            </p>
          </div>
        </div>

        {/* Skills and About */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md md:w-1/3">
            <h3 className="text-lg font-semibold mb-4">Skills</h3>
            <ul>
              {user.profile.interests.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md md:w-2/3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3">About Me</h3>
                <p>{user.profile.bio || "No bio added"}</p>
              </div>
              {isOwnProfile && (
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                  onClick={() => setIsEditingBio(true)}
                >
                  Edit
                </button>
              )}
            </div>

            {/* <h3 className="text-lg font-semibold mb-3">About Me</h3>
            <p>{user.profile.bio || "No bio added"}</p> */}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold mb-4">Experience</h3>
          {user.profile.experiences.map((experience, index) => (
            <div key={index} className="mb-4">
              <h4 className="font-medium">{experience}</h4>
            </div>
          ))}
        </div>

        {/* Github Activity - show for all users with GitHub URL */}
        {user.profile.githubUrl && (
          <GithubActivity githubUrl={user.profile.githubUrl} />
        )}

        {/* Connect Button - only show when viewing someone else's profile */}
        {!isOwnProfile && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <button
              onClick={handleConnect}
              disabled={
                connectionStatus === "pending" ||
                connectionStatus === "connected"
              }
              className={`px-6 py-3 rounded-md w-full md:w-auto ${
                connectionStatus === "connected"
                  ? "bg-green-500 text-white cursor-not-allowed"
                  : connectionStatus === "pending"
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "pending"
                ? "Request Sent"
                : "Connect"}
            </button>
          </div>
        )}

        {/* Modal to edit bio - only show for own profile */}
        {isEditingBio && isOwnProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
            <div className="bg-white shadow-lg w-full max-w-md p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

              <h4 className="font-medium mb-2">Name</h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows="1"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
              />

              <h4 className="font-medium mb-2">Bio</h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows="5"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <h4 className="font-medium mb-2">Skills</h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows="3"
                value={interests.join("\n")}
                onChange={(e) =>
                  setInterests(
                    e.target.value.split("\n").filter((skill) => skill.trim())
                  )
                }
                placeholder="Enter each skill on a new line"
              />

              <h4 className="font-medium mb-2">Profile Picture URL</h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows="2"
                value={profilePicUrl}
                onChange={(e) => setProfilePicUrl(e.target.value)}
                placeholder="Enter profile picture URL"
              />

              <h4 className="font-medium mb-2">GitHub URL</h4>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                value={user.profile.githubUrl || ""}
                onChange={(e) => {
                  setUser((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      githubUrl: e.target.value,
                    },
                  }));
                }}
                placeholder="https://github.com/yourusername"
              />

              <h4 className="font-medium mb-2">Experience</h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                rows="5"
                value={experiences.join("\n")}
                onChange={(e) =>
                  setExperiences(
                    e.target.value.split("\n").filter((exp) => exp.trim())
                  )
                }
                placeholder="Enter each experience on a new line"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleSaveBio}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
