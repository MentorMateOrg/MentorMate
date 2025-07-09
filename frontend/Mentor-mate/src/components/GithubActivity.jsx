import React, { useState, useEffect } from "react";

export default function GithubActivity({ githubUrl }) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!githubUrl) {
      return;
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

    fetchGithubActivity();
  }, [githubUrl]);

  if (!githubUrl) {
    return (
      <div>
        <h3>Github Activity</h3>
        <p>No Github URL Provided</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h3>Github Activity</h3>
        <p>Loading Github data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3>Github Activity</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div>
        <h3>Github Activity</h3>
        <p>No activity data available</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Github Activity</h3>
      <div>
        <p>Contributions this month: {activity.contributionsThisMonth}</p>
        <p>Top language: {activity.topLanguage}</p>
        <p>Top project: {activity.topProject}</p>
        <p>Commit streak: {activity.commitStreak} days</p>
        {activity.badges && activity.badges.length > 0 && (
          <div>
            <h4>Badges:</h4>
            {activity.badges.map((badge, index) => (
              <div key={index}>
                <strong>{badge.name}</strong>: {badge.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
