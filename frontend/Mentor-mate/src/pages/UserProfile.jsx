import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          alert("User not found");
        }
      } catch (error) {
        alert("Error fetching user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

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
          <img src={user.profile.profilePicUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-2 border-purple-500"></img>
          <div className="ml-0 md:ml-6 text-center md:text-left mt-4 md:mt-0">
            <h2 className="text-2xl font-semibold">{user.profile.full_name}</h2>
            <p className="text-gray-500">{user.profile.role || "Role not added"}</p>
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
<h3 className="text-lg font-semibold mb-3">About Me</h3>
<p>{user.profile.bio || "No bio added"}</p>
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
      </div>
    </>
  );
}
