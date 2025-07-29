import React, { useState, useEffect } from "react";
import { API_URL } from "../config.js";

const CommunityArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
  });
  const [commentInputs, setCommentInputs] = useState({});

  // Fetch articles on component mount
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/articles`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        alert("Failed to fetch articles. Please try again.");
      }
    } catch (error) {
      alert("Error fetching articles. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const createArticle = async (e) => {
    e.preventDefault();
    if (!newArticle.title.trim() || !newArticle.content.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: newArticle.title.trim(),
          content: newArticle.content.trim(),
        }),
      });

      if (response.ok) {
        const article = await response.json();
        setArticles([article, ...articles]);
        setNewArticle({ title: "", content: "" });
        setShowCreateForm(false);
      } else {
        alert("Failed to create article. Please try again.");
      }
    } catch (error) {
      alert("Error creating article. Please check your connection.");
    }
  };

  const toggleLike = async (articleId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/articles/${articleId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setArticles(
          articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  isLikedByUser: result.liked,
                  _count: {
                    ...article._count,
                    likes: result.liked
                      ? article._count.likes + 1
                      : article._count.likes - 1,
                  },
                }
              : article
          )
        );
      } else {
        alert("Failed to toggle like. Please try again.");
      }
    } catch (error) {
      alert("Error toggling like. Please check your connection.");
    }
  };

  const addComment = async (articleId) => {
    const commentContent = commentInputs[articleId];
    if (!commentContent || !commentContent.trim()) return;

    try {
      const response = await fetch(
        `${API_URL}/api/articles/${articleId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            content: commentContent.trim(),
          }),
        }
      );

      if (response.ok) {
        const comment = await response.json();
        setArticles(
          articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  comments: [comment, ...article.comments],
                  _count: {
                    ...article._count,
                    comments: article._count.comments + 1,
                  },
                }
              : article
          )
        );
        setCommentInputs({ ...commentInputs, [articleId]: "" });
      } else {
        alert("Failed to add comment. Please try again.");
      }
    } catch (error) {
      alert("Error adding comment. Please check your connection.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-purple-600 mb-4">
          Community Articles
        </h2>
        <p className="text-gray-500">Loading articles...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-purple-600">
          Community Articles
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 text-sm"
        >
          {showCreateForm ? "Cancel" : "✍️ Write Article"}
        </button>
      </div>

      {/* Create Article Form */}
      {showCreateForm && (
        <form
          onSubmit={createArticle}
          className="mb-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="mb-4">
            <input
              type="text"
              value={newArticle.title}
              onChange={(e) =>
                setNewArticle({ ...newArticle, title: e.target.value })
              }
              placeholder="Article title (e.g., 'Tips for Learning React')"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <textarea
              value={newArticle.content}
              onChange={(e) =>
                setNewArticle({ ...newArticle, content: e.target.value })
              }
              placeholder="Share your knowledge, experiences, or insights with the community..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="6"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
            >
              Publish Article
            </button>
          </div>
        </form>
      )}

      {/* Articles List */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {articles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No articles yet!</p>
            <p className="text-sm text-gray-400">
              Be the first to share your knowledge with the community
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              {/* Article Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      article.author.profile?.profilePicUrl ||
                      "https://static.vecteezy.com/system/resources/previews/055/581/121/non_2x/default-profile-picture-icon-avatar-photo-placeholder-illustration-vector.jpg"
                    }
                    alt={article.author.profile?.full_name || "Author"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {article.author.profile?.full_name || "Anonymous"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatDate(article.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {article.author.profile?.role || "UNKNOWN"}
                </span>
              </div>

              {/* Article Content */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {article.content}
                </p>
              </div>

              {/* Article Actions */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-100">
                <button
                  onClick={() => toggleLike(article.id)}
                  className={`flex items-center gap-1 text-sm ${
                    article.isLikedByUser
                      ? "text-red-600"
                      : "text-gray-500 hover:text-red-600"
                  }`}
                >
                  <span className="text-lg">
                    {article.isLikedByUser ? "❤️" : "🤍"}
                  </span>
                  {article._count.likes}{" "}
                  {article._count.likes === 1 ? "like" : "likes"}
                </button>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <span className="text-lg">💬</span>
                  {article._count.comments}{" "}
                  {article._count.comments === 1 ? "comment" : "comments"}
                </span>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                {/* Add Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInputs[article.id] || ""}
                    onChange={(e) =>
                      setCommentInputs({
                        ...commentInputs,
                        [article.id]: e.target.value,
                      })
                    }
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addComment(article.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => addComment(article.id)}
                    className="bg-purple-500 text-white px-3 py-2 rounded-md hover:bg-purple-600 text-sm"
                  >
                    Post
                  </button>
                </div>

                {/* Comments List */}
                {article.comments.slice(0, 3).map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 bg-gray-50 p-3 rounded-md"
                  >
                    <img
                      src={
                        comment.author.profile?.profilePicUrl ||
                        "https://static.vecteezy.com/system/resources/previews/055/581/121/non_2x/default-profile-picture-icon-avatar-photo-placeholder-illustration-vector.jpg"
                      }
                      alt={comment.author.profile?.full_name || "Commenter"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.author.profile?.full_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {/* Show more comments indicator */}
                {article.comments.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {article.comments.length - 3} more comments
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {articles.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {articles.length} {articles.length === 1 ? "article" : "articles"} in
          the community
        </div>
      )}
    </div>
  );
};

export default CommunityArticles;
