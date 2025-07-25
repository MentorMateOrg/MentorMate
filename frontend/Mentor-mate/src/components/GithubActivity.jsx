import React, { useState, useEffect } from "react";
import GitHubCalendar from "react-github-calendar";
import { LoadingSpinnerWithText } from "./LoadingSpinner";

export default function GithubActivity({ githubUrl }) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  let username = null;
  try {
    username = extractUsernameFromUrl(githubUrl);
  } catch (err) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        <h3 className="text-lg font-semibold mb-3">Github Activity</h3>
        <p className="text-red-500">Invalid GitHub URL: {err.message}</p>
      </div>
    );
  }

  const fetchGithubActivity = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/github/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ githubUrl }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      } else {
        setError("Error fetching Github activity");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!githubUrl) return;
    fetchGithubActivity();
  }, [githubUrl]);

  const GithubActivityHeader = (
    <h3 className="text-lg font-semibold mb-3">Github Activity</h3>
  );

  function extractUsernameFromUrl(url) {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      throw new Error("Username not found in GitHub URL");
    }
    return parts[0];
  }

  if (!githubUrl) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {GithubActivityHeader}
        <p>No Github URL provided</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {GithubActivityHeader}
        <div className="py-8">
          <LoadingSpinnerWithText
            text="Loading GitHub activity..."
            size="medium"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {GithubActivityHeader}
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {GithubActivityHeader}
        <p>No activity data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-4">
      <h3 className="text-lg font-semibold mb-3">Github Activity</h3>
      <div className="space-y-2 text-gray-700">
        <p>Contributions this month: {activity.contributionsThisMonth}</p>
        <p>Top language: {activity.topLanguage}</p>
        <p>Top project: {activity.topProject}</p>
        <p>Commit streak: 🔥{activity.commitStreak} day(s)</p>

        {activity.badges && activity.badges.length > 0 && (
          <div>
            <h4 className="font-semibold mt-4">Badges</h4>
            {activity.badges.map((badge, index) => (
              <div key={index}>
                <strong>{badge.name}</strong>: {badge.description}
              </div>
            ))}
          </div>
        )}

        {username && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Contributions Chart</h4>
            <GitHubCalendar username={username} />
          </div>
        )}
      </div>
    </div>
  );
}
