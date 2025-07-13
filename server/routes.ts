import type { Express } from "express";
import { createServer, type Server } from "http";
import { join } from "path";
import { storage } from "./storage";
import { insertUserSchema, insertFlashcardDeckSchema, insertFlashcardSchema, insertQuizSchema, insertNoteSchema, insertAssignmentSchema, insertStudyGroupSchema, insertPostSchema, insertPostCommentSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import { mediaStorage } from "./media-storage";
import { cloudMedia } from "./cloud-media";
import { notificationService } from "./notification-service";
import { streakService } from "./streak-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve media files
  app.get("/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const mediaId = filename.split('.')[0];
      const mediaBuffer = await mediaStorage.getMedia(mediaId);
      
      if (!mediaBuffer) {
        return res.status(404).json({ message: "Media not found" });
      }
      
      // Set appropriate content type
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentType = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
      }[ext || ''] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
      res.send(mediaBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve media" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid user data" });
    }
  });

  app.get("/api/users/by-firebase/:uid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check and update daily streak
      const streakResult = await streakService.updateDailyStreak(user.id);
      
      res.json({
        ...user,
        streak: streakResult.newStreak,
        streakUpdated: streakResult.updated,
        celebrateStreak: streakResult.celebrateStreak,
        streakMessage: streakResult.celebrateStreak ? streakService.getStreakCelebrationMessage(streakResult.newStreak) : undefined,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), updates);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.patch("/api/users/:id/xp", async (req, res) => {
    try {
      const { xpGain } = z.object({ xpGain: z.number() }).parse(req.body);
      const user = await storage.updateUserXP(parseInt(req.params.id), xpGain);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid XP data" });
    }
  });

  // Streak-specific endpoint for manual checking
  app.post("/api/users/:id/check-streak", async (req, res) => {
    try {
      const streakResult = await streakService.updateDailyStreak(parseInt(req.params.id));
      res.json(streakResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to check streak" });
    }
  });

  // Reset streak for testing purposes
  app.post("/api/users/:id/reset-streak", async (req, res) => {
    try {
      const user = await storage.updateUser(parseInt(req.params.id), {
        streak: 0,
        lastActive: null,
      });
      res.json({ message: "Streak reset successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset streak" });
    }
  });

  // Flashcard routes
  app.get("/api/flashcard-decks/:userId", async (req, res) => {
    try {
      const decks = await storage.getFlashcardDecks(parseInt(req.params.userId));
      res.json(decks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcard decks" });
    }
  });

  app.post("/api/flashcard-decks", async (req, res) => {
    try {
      const deckData = insertFlashcardDeckSchema.parse(req.body);
      const deck = await storage.createFlashcardDeck(deckData);
      res.json(deck);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid deck data" });
    }
  });

  app.get("/api/flashcards/:deckId", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcards(parseInt(req.params.deckId));
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const flashcardData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(flashcardData);
      res.json(flashcard);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid flashcard data" });
    }
  });

  app.patch("/api/flashcards/:id", async (req, res) => {
    try {
      const updates = req.body;
      const flashcard = await storage.updateFlashcard(parseInt(req.params.id), updates);
      res.json(flashcard);
    } catch (error) {
      res.status(400).json({ message: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      await storage.deleteFlashcard(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete flashcard" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes/:userId", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes(parseInt(req.params.userId));
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/public/all", async (req, res) => {
    try {
      const quizzes = await storage.getPublicQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public quizzes" });
    }
  });

  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid quiz data" });
    }
  });

  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(parseInt(req.params.id));
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const attemptData = z.object({
        quizId: z.number(),
        userId: z.number(),
        score: z.number(),
        totalQuestions: z.number(),
        answers: z.array(z.number()),
      }).parse(req.body);
      
      const attempt = await storage.createQuizAttempt(attemptData);
      
      // Award XP based on score
      const xpGain = Math.round((attempt.score / attempt.totalQuestions) * 50);
      await storage.updateUserXP(attempt.userId, xpGain);
      
      res.json(attempt);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid attempt data" });
    }
  });

  app.get("/api/quiz-attempts/:userId", async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(parseInt(req.params.userId));
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Notes routes
  app.get("/api/notes/:userId", async (req, res) => {
    try {
      const notes = await storage.getNotes(parseInt(req.params.userId));
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid note data" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const updates = req.body;
      const note = await storage.updateNote(parseInt(req.params.id), updates);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.get("/api/notes/:userId/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter required" });
      }
      const notes = await storage.searchNotes(parseInt(req.params.userId), q);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to search notes" });
    }
  });

  // Assignment routes
  app.get("/api/assignments/:userId", async (req, res) => {
    try {
      const assignments = await storage.getAssignments(parseInt(req.params.userId));
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:userId/upcoming/:days", async (req, res) => {
    try {
      const assignments = await storage.getUpcomingAssignments(
        parseInt(req.params.userId),
        parseInt(req.params.days)
      );
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid assignment data" });
    }
  });

  app.patch("/api/assignments/:id", async (req, res) => {
    try {
      const updates = req.body;
      const assignment = await storage.updateAssignment(parseInt(req.params.id), updates);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      await storage.deleteAssignment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Study group routes
  app.get("/api/study-groups/:userId", async (req, res) => {
    try {
      const groups = await storage.getStudyGroups(parseInt(req.params.userId));
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study groups" });
    }
  });

  app.get("/api/study-groups/public/all", async (req, res) => {
    try {
      const groups = await storage.getPublicStudyGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public study groups" });
    }
  });

  app.post("/api/study-groups", async (req, res) => {
    try {
      const groupData = insertStudyGroupSchema.parse(req.body);
      const group = await storage.createStudyGroup(groupData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid study group data" });
    }
  });

  app.post("/api/study-groups/:groupId/join", async (req, res) => {
    try {
      const { userId } = z.object({ userId: z.number() }).parse(req.body);
      const member = await storage.joinStudyGroup(parseInt(req.params.groupId), userId);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to join group" });
    }
  });

  app.get("/api/study-groups/:groupId/members", async (req, res) => {
    try {
      const members = await storage.getStudyGroupMembers(parseInt(req.params.groupId));
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  // Achievement routes
  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const achievements = await storage.getUserAchievements(parseInt(req.params.userId));
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievementData = z.object({
        userId: z.number(),
        type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      }).parse(req.body);
      
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid achievement data" });
    }
  });

  // User discovery routes
  app.get("/api/users/search", async (req, res) => {
    try {
      const { q, userId } = req.query;
      if (!q || !userId) {
        return res.status(400).json({ message: "Query and userId are required" });
      }
      
      const users = await storage.searchUsers(q as string, parseInt(userId as string));
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/discover/:userId", async (req, res) => {
    try {
      const users = await storage.getAllUsers(parseInt(req.params.userId));
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Avatar upload route
  app.post("/api/users/:id/avatar", async (req, res) => {
    try {
      const { photoURL } = req.body;
      const user = await storage.updateUser(parseInt(req.params.id), { photoURL });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Chat routes
  app.post("/api/conversations", async (req, res) => {
    try {
      const { participants, type, name } = req.body;
      const conversation = await storage.createConversation(participants, type, name);
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/user/:userId", async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(parseInt(req.params.userId));
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { limit } = req.query;
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const messages = await storage.getConversationMessages(
        conversationId, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { senderId, content, type, mediaUrls } = req.body;
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId) || !senderId || !content) {
        return res.status(400).json({ message: "Invalid message data" });
      }
      
      const message = await storage.sendMessage(conversationId, senderId, content, type, mediaUrls);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const posts = await storage.getPosts(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/user/:userId", async (req, res) => {
    try {
      const posts = await storage.getUserPosts(parseInt(req.params.userId));
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      
      // Try to optimize media URLs (skip if no cloud service configured)
      if (postData.mediaUrls && postData.mediaUrls.length > 0) {
        try {
          postData.mediaUrls = await cloudMedia.processMediaUrls(postData.mediaUrls);
        } catch (error) {
          console.log('Cloud media optimization failed, proceeding with original URLs');
          // Continue with original URLs if cloud processing fails
        }
      }
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid post data" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const updates = req.body;
      const post = await storage.updatePost(parseInt(req.params.id), updates);
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      await storage.deletePost(parseInt(req.params.id));
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Post likes routes
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      const postId = parseInt(req.params.id);
      const like = await storage.likePost(postId, userId);
      
      if (like) {
        // Create notification for post owner
        const post = await storage.getPosts(1, 0);
        const targetPost = post.find(p => p.id === postId);
        if (targetPost) {
          await notificationService.createLikeNotification(postId, targetPost.userId, userId);
        }
        res.json({ message: "Post liked successfully", like });
      } else {
        res.status(400).json({ message: "Post already liked" });
      }
    } catch (error) {
      res.status(400).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.unlikePost(parseInt(req.params.id), userId);
      res.json({ message: "Post unliked successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to unlike post" });
    }
  });

  // Post comments routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostComments(parseInt(req.params.id));
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const commentData = insertPostCommentSchema.parse({
        ...req.body,
        postId
      });
      const comment = await storage.createPostComment(commentData);
      
      // Create notification for post owner
      const post = await storage.getPosts(1, 0);
      const targetPost = post.find(p => p.id === postId);
      if (targetPost) {
        await notificationService.createCommentNotification(postId, targetPost.userId, commentData.userId, commentData.content);
      }
      
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid comment data" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      await storage.deletePostComment(parseInt(req.params.id));
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Post report route
  app.post("/api/posts/:id/report", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { userId, reason } = req.body;
      
      if (!userId || !reason) {
        return res.status(400).json({ message: "User ID and reason are required" });
      }

      // Get the post details
      const posts = await storage.getPosts(1, 0);
      const reportedPost = posts.find(p => p.id === postId);
      
      if (!reportedPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Get the reporting user
      const reportingUser = await storage.getUser(userId);
      
      if (!reportingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create notification for admin (assuming admin has ID 1)
      const reportNotification = {
        userId: 1, // Admin user ID
        type: "post_report",
        title: "Post Reported",
        message: `User ${reportingUser.displayName || reportingUser.username} reported a post: ${reason}`,
        data: {
          postId,
          postContent: reportedPost.content,
          postAuthor: reportedPost.user.displayName || reportedPost.user.username,
          reportedBy: userId,
          reportReason: reason,
          reportedAt: new Date().toISOString()
        },
        isRead: false,
      };

      await storage.createNotification(reportNotification);
      
      res.json({ message: "Report submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Admin routes
  app.get("/api/admin/tables", async (req, res) => {
    try {
      const result = await storage.getTableInfo();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table info" });
    }
  });

  app.get("/api/admin/table-data/:tableName", async (req, res) => {
    try {
      const { tableName } = req.params;
      const { search } = req.query;
      const result = await storage.getTableData(tableName, search as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch table data" });
    }
  });

  app.post("/api/admin/execute-sql", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "SQL query is required" });
      }
      
      // Basic security check - prevent dangerous operations
      const lowerQuery = query.toLowerCase().trim();
      const dangerousKeywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update'];
      const isDangerous = dangerousKeywords.some(keyword => lowerQuery.startsWith(keyword));
      
      if (isDangerous && !lowerQuery.startsWith('select')) {
        return res.status(403).json({ message: "Chỉ cho phép SELECT queries để đảm bảo an toàn" });
      }
      
      const result = await storage.executeSqlQuery(query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to execute SQL query" });
    }
  });

  app.delete("/api/admin/delete-record", async (req, res) => {
    try {
      const { table, id } = req.body;
      if (!table || !id) {
        return res.status(400).json({ message: "Table and ID are required" });
      }
      
      const result = await storage.deleteRecord(table, id);
      res.json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete record" });
    }
  });

  // Media optimization endpoint
  app.post("/api/admin/optimize-media", async (req, res) => {
    try {
      const posts = await storage.executeSqlQuery("SELECT id, media_urls FROM posts WHERE media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0");
      
      let optimizedCount = 0;
      for (const post of posts.rows) {
        const mediaUrls = post.media_urls;
        if (mediaUrls && mediaUrls.length > 0) {
          const hasDataUrls = mediaUrls.some((media: any) => media.url && media.url.startsWith('data:'));
          
          if (hasDataUrls) {
            const optimizedUrls = await cloudMedia.processMediaUrls(mediaUrls);
            await storage.executeSqlQuery(`UPDATE posts SET media_urls = '${JSON.stringify(optimizedUrls)}' WHERE id = ${post.id}`);
            optimizedCount++;
          }
        }
      }
      
      res.json({ 
        message: `Successfully optimized ${optimizedCount} posts with media URLs`,
        optimizedCount 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to optimize media" });
    }
  });

  // Notification routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getNotifications(parseInt(req.params.userId));
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/:userId/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(parseInt(req.params.userId));
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid notification data" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationAsRead(parseInt(req.params.id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(parseInt(req.params.userId));
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      await storage.deleteNotification(parseInt(req.params.id));
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Admin notification routes
  // Send admin notification to all users
  app.post("/api/admin/send-notification-all", async (req, res) => {
    try {
      const { title, message, priority } = z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      }).parse(req.body);

      // Get all users
      const users = await storage.getAllUsers(0); // Pass 0 as currentUserId since admin sees all
      
      // Create notification for each user
      const notifications = [];
      for (const user of users) {
        const notification = await storage.createNotification({
          userId: user.id,
          type: "admin_announcement",
          title,
          message,
          data: { priority, senderId: 1 }, // Assuming admin has ID 1
        });
        notifications.push(notification);
      }

      res.json({ 
        message: `Notification sent to ${users.length} users`,
        count: users.length,
        notifications: notifications.slice(0, 5) // Return first 5 as sample
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to send notification" });
    }
  });

  // Send admin notification to specific user
  app.post("/api/admin/send-notification-user", async (req, res) => {
    try {
      const { userId, title, message, priority } = z.object({
        userId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      }).parse(req.body);

      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const notification = await storage.createNotification({
        userId,
        type: "admin_message",
        title,
        message,
        data: { priority, senderId: 1 }, // Assuming admin has ID 1
      });

      res.json({ 
        message: `Notification sent to user ${user.username}`,
        notification
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to send notification" });
    }
  });

  app.post("/api/admin/generate-suggestions", async (req, res) => {
    try {
      await notificationService.generatePostSuggestions();
      res.json({ message: "Post suggestions generated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate post suggestions" });
    }
  });

  app.post("/api/admin/send-violation-notice", async (req, res) => {
    try {
      const { userId, postId, violationReason, adminMessage } = req.body;
      
      if (!userId || !postId || !violationReason || !adminMessage) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the post content before deleting
      const posts = await storage.getPosts(1, 0);
      const postToDelete = posts.find(p => p.id === postId);
      
      if (!postToDelete) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Create violation notification
      await notificationService.createViolationNotification(
        userId,
        violationReason,
        adminMessage,
        postToDelete.content
      );

      // Delete the post
      await storage.deletePost(postId);

      res.json({ message: "Violation notice sent and post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send violation notice" });
    }
  });

  // SEO and Meta Routes
  app.get("/robots.txt", (req, res) => {
    res.type('text/plain');
    res.sendFile(join(process.cwd(), 'robots.txt'));
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type('application/xml');
    res.sendFile(join(process.cwd(), 'sitemap.xml'));
  });

  app.get("/manifest.json", (req, res) => {
    res.type('application/json');
    res.sendFile(join(process.cwd(), 'manifest.json'));
  });

  app.get("/.well-known/security.txt", (req, res) => {
    res.type('text/plain');
    res.sendFile(join(process.cwd(), '.well-known/security.txt'));
  });

  // Health check endpoint for monitoring
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "Bright Starts Academy",
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
