import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Post, PostComment, InsertPostComment, User } from "@shared/schema";

type PostWithUser = Post & { 
  user: User; 
  hasLiked?: boolean; 
  likesCount: number; 
  commentsCount: number;
};

type CommentWithUser = PostComment & { user: User };

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  const postId = id ? parseInt(id) : 0;

  // Fetch single post
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  });

  const post = posts.find((p: PostWithUser) => p.id === postId);

  // Fetch comments for the post
  const { data: comments = [] } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    enabled: !!postId,
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      if (isLiked) {
        return apiRequest("DELETE", `/api/posts/${postId}/like`, { userId: user.id });
      } else {
        return apiRequest("POST", `/api/posts/${postId}/like`, { userId: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const commentData: InsertPostComment = {
        postId,
        userId: user.id,
        content,
      };
      
      return apiRequest("POST", `/api/posts/${postId}/comments`, commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentContent("");
    },
  });

  const handleAddComment = () => {
    if (!commentContent.trim()) return;
    addCommentMutation.mutate({ postId, content: commentContent });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to view posts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="rounded-full bg-muted h-10 w-10"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Post not found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              This post doesn't exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Post</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={post.user.photoURL || ""} />
                <AvatarFallback>
                  {(post.user.displayName || post.user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.user.displayName || post.user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{post.content}</p>
          
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="grid gap-2">
              {post.mediaUrls.map((media, index) => (
                <div key={index} className="rounded-lg overflow-hidden">
                  {media.type === "image" ? (
                    <img 
                      src={media.url} 
                      alt="Post media" 
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full h-auto max-h-96"
                      poster={media.thumbnailUrl}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator />
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => likePostMutation.mutate({ 
                postId: post.id, 
                isLiked: post.hasLiked || false 
              })}
              className="flex items-center space-x-2"
            >
              <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{post.likesCount}</span>
            </Button>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentsCount}</span>
            </div>
          </div>

          <Separator />

          {/* Add comment section */}
          <div className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback>
                  {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddComment();
                    }
                  }}
                />
                <Button 
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentContent.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((comment: CommentWithUser) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user.photoURL || ""} />
                    <AvatarFallback>
                      {(comment.user.displayName || comment.user.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm">{comment.user.displayName || comment.user.username}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}