import React, { useState, useEffect } from "react";
import { API_URL } from "../config";
import "./GroupMentorship.css";

const GroupMentorship = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [membershipStatuses, setMembershipStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    maxMembers: 10,
  });

  useEffect(() => {
    fetchUserProfile();
    fetchGroups();
    fetchMyGroups();
    fetchJoinedGroups();
    fetchPendingRequests();
  }, []);

  const fetchMembershipStatus = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-membership/status/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
    } catch (error) {
      return "NOT_MEMBER";
    }
    return "NOT_MEMBER";
  };

  const fetchMembershipStatuses = async (groups) => {
    const statuses = {};
    for (const group of groups) {
      const status = await fetchMembershipStatus(group.id);
      statuses[group.id] = status;
    }
    setMembershipStatuses(statuses);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      setError("Failed to fetch user profile");
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/mentorship-groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        // Fetch membership statuses for all groups
        await fetchMembershipStatuses(data);
      }
    } catch (error) {
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/mentorship-groups/my-groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMyGroups(data);
      }
    } catch (error) {
      setError("Failed to fetch your groups");
    }
  };

  const fetchJoinedGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/mentorship-groups/joined-groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setJoinedGroups(data);
      }
    } catch (error) {
      setError("Failed to fetch joined groups");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-membership/pending-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      setError("Failed to fetch pending requests");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/mentorship-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        setNewGroup({ name: "", description: "", maxMembers: 10 });
        setShowCreateForm(false);
        fetchMyGroups();
        fetchGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create group");
      }
    } catch (error) {
      setError("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-membership/join/${groupId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchGroups();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to join group");
      }
    } catch (error) {
      setError("Failed to join group");
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-membership/request/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: action }),
        }
      );

      if (response.ok) {
        fetchPendingRequests();
        fetchMyGroups();
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || `Failed to ${action.toLowerCase()} request`
        );
      }
    } catch (error) {
      setError(`Failed to ${action.toLowerCase()} request`);
    }
  };

  const openGroupForum = (group) => {
    setSelectedGroup(group);
    setActiveTab("forum");
  };

  const renderGroupCard = (
    group,
    showJoinButton = false,
    showManageButton = false
  ) => {
    const membershipStatus = membershipStatuses[group.id];
    const isGroupFull = group._count?.memberships >= group.maxMembers;
    
    const getJoinButtonProps = () => {
      if (isGroupFull) {
        return {
          text: "Full",
          disabled: true,
          className: "btn btn-secondary"
        };
      }
      
      switch (membershipStatus) {
        case "PENDING":
          return {
            text: "Pending Approval",
            disabled: true,
            className: "btn btn-warning"
          };
        case "ACCEPTED":
          return {
            text: "Already Joined",
            disabled: true,
            className: "btn btn-success"
          };
        case "REJECTED":
          return {
            text: "Join Group",
            disabled: false,
            className: "btn btn-primary"
          };
        case "MENTOR":
          return {
            text: "Your Group",
            disabled: true,
            className: "btn btn-secondary"
          };
        default:
          return {
            text: "Join Group",
            disabled: false,
            className: "btn btn-primary"
          };
      }
    };

    const joinButtonProps = getJoinButtonProps();

    return (
      <div key={group.id} className="group-card">
        <div className="group-header">
          <h3>{group.name}</h3>
          <span className="member-count">
            {group._count?.memberships || 0}/{group.maxMembers} members
          </span>
        </div>

        <p className="group-description">
          {group.description || "No description provided"}
        </p>

        <div className="group-mentor">
          <strong>Mentor:</strong> {group.mentor?.profile?.full_name || "Unknown"}
        </div>

        <div className="group-actions">
          {showJoinButton && (
            <button
              onClick={() => handleJoinGroup(group.id)}
              className={joinButtonProps.className}
              disabled={joinButtonProps.disabled}
            >
              {joinButtonProps.text}
            </button>
          )}

          {showManageButton && (
            <button
              onClick={() => openGroupForum(group)}
              className="btn btn-secondary"
            >
              Manage Group
            </button>
          )}

          <button
            onClick={() => openGroupForum(group)}
            className="btn btn-outline"
          >
            View Forum
          </button>
        </div>
      </div>
    );
  };

  const renderCreateGroupForm = () => (
    <div className="create-group-form">
      <h3>Create New Mentorship Group</h3>
      <form onSubmit={handleCreateGroup}>
        <div className="form-group">
          <label>Group Name *</label>
          <input
            type="text"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={newGroup.description}
            onChange={(e) =>
              setNewGroup({ ...newGroup, description: e.target.value })
            }
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Maximum Members</label>
          <input
            type="number"
            min="2"
            max="50"
            value={newGroup.maxMembers}
            onChange={(e) =>
              setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderPendingRequests = () => (
    <div className="pending-requests">
      <h3>Pending Membership Requests</h3>
      {pendingRequests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        pendingRequests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-info">
              <strong>{request.mentee.profile.full_name}</strong>
              <p>
                wants to join <strong>{request.group.name}</strong>
              </p>
              <small>
                Requested on {new Date(request.joinedAt).toLocaleDateString()}
              </small>
            </div>
            <div className="request-actions">
              <button
                onClick={() => handleRequestAction(request.id, "ACCEPTED")}
                className="btn btn-success btn-sm"
              >
                Accept
              </button>
              <button
                onClick={() => handleRequestAction(request.id, "REJECTED")}
                className="btn btn-danger btn-sm"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (selectedGroup && activeTab === "forum") {
    return (
      <GroupForum
        group={selectedGroup}
        onBack={() => {
          setSelectedGroup(null);
          setActiveTab("browse");
        }}
        userProfile={userProfile}
      />
    );
  }

  return (
    <div className="group-mentorship">
      <div className="mentorship-header">
        <h2>Group Mentorship</h2>
        {userProfile?.role === "MENTOR" && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Group
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="mentorship-tabs">
        <button
          className={`tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse Groups
        </button>

        {userProfile?.role === "MENTOR" && (
          <button
            className={`tab ${activeTab === "my-groups" ? "active" : ""}`}
            onClick={() => setActiveTab("my-groups")}
          >
            My Groups ({myGroups.length})
          </button>
        )}

        <button
          className={`tab ${activeTab === "joined" ? "active" : ""}`}
          onClick={() => setActiveTab("joined")}
        >
          Joined Groups ({joinedGroups.length})
        </button>

        {userProfile?.role === "MENTOR" && pendingRequests.length > 0 && (
          <button
            className={`tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Requests ({pendingRequests.length})
          </button>
        )}
      </div>

      <div className="tab-content">
        {showCreateForm && renderCreateGroupForm()}

        {activeTab === "browse" && !showCreateForm && (
          <div className="groups-grid">
            {loading ? (
              <div className="loading">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="no-groups">No groups available</div>
            ) : (
              groups.map((group) =>
                renderGroupCard(
                  group,
                  userProfile?.role === "MENTEE" &&
                    group.mentor.id !== userProfile.userId,
                  false
                )
              )
            )}
          </div>
        )}

        {activeTab === "my-groups" && (
          <div className="groups-grid">
            {myGroups.length === 0 ? (
              <div className="no-groups">
                You haven't created any groups yet
              </div>
            ) : (
              myGroups.map((group) => renderGroupCard(group, false, true))
            )}
          </div>
        )}

        {activeTab === "joined" && (
          <div className="groups-grid">
            {joinedGroups.length === 0 ? (
              <div className="no-groups">You haven't joined any groups yet</div>
            ) : (
              joinedGroups.map((group) => renderGroupCard(group, false, false))
            )}
          </div>
        )}

        {activeTab === "requests" && renderPendingRequests()}
      </div>
    </div>
  );
};

// Group Forum Component (placeholder for now)
const GroupForum = ({ group, onBack, userProfile }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [group.id]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-posts/group/${group.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/group-posts/group/${group.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newPost }),
        }
      );

      if (response.ok) {
        setNewPost("");
        fetchPosts();
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="group-forum">
      <div className="forum-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <h2>{group.name} Forum</h2>
      </div>

      <div className="post-form">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something helpful with the group..."
            rows="3"
          />
          <button type="submit" className="btn btn-primary">
            Post
          </button>
        </form>
      </div>

      <div className="posts-list">
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <strong>{post.author.profile.full_name}</strong>
                <span className="post-date">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="post-content">{post.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupMentorship;
