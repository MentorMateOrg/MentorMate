import express from "express";
import { PrismaClient } from "@prisma/client";
import { authToken } from "../middleware/authToken.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all articles with likes and comments count
router.get("/", authToken, async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { published: true },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        likes: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add user's like status to each article
    const articlesWithUserLikes = articles.map((article) => ({
      ...article,
      isLikedByUser: article.likes.some((like) => like.userId === req.user.id),
    }));

    res.json(articlesWithUserLikes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// Get single article by ID
router.get("/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        likes: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Add user's like status
    const articleWithUserLike = {
      ...article,
      isLikedByUser: article.likes.some((like) => like.userId === req.user.id),
    };

    res.json(articleWithUserLike);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

// Create new article
router.post("/", authToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: req.user.id,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.status(201).json({
      ...article,
      isLikedByUser: false,
      likes: [],
      comments: [],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create article" });
  }
});

// Update article (only by author)
router.put("/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    // Check if article exists and user is the author
    const existingArticle = await prisma.article.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (existingArticle.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this article" });
    }

    const updatedArticle = await prisma.article.update({
      where: { id: parseInt(id) },
      data: {
        title: title?.trim(),
        content: content?.trim(),
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        likes: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.json({
      ...updatedArticle,
      isLikedByUser: updatedArticle.likes.some(
        (like) => like.userId === req.user.id
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update article" });
  }
});

// Delete article (only by author)
router.delete("/:id", authToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists and user is the author
    const existingArticle = await prisma.article.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (existingArticle.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this article" });
    }

    await prisma.article.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete article" });
  }
});

// Toggle like on article
router.post("/:id/like", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Check if user already liked this article
    const existingLike = await prisma.articleLike.findUnique({
      where: {
        userId_articleId: {
          userId: req.user.id,
          articleId: articleId,
        },
      },
    });

    if (existingLike) {
      // Unlike the article
      await prisma.articleLike.delete({
        where: {
          userId_articleId: {
            userId: req.user.id,
            articleId: articleId,
          },
        },
      });
      res.json({ liked: false, message: "Article unliked" });
    } else {
      // Like the article
      await prisma.articleLike.create({
        data: {
          userId: req.user.id,
          articleId: articleId,
        },
      });
      res.json({ liked: true, message: "Article liked" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Add comment to article
router.post("/:id/comments", authToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const articleId = parseInt(id);

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: req.user.id,
        articleId: articleId,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Update comment (only by author)
router.put("/comments/:commentId", authToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this comment" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: {
        content: content.trim(),
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete comment (only by author)
router.delete("/comments/:commentId", authToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
