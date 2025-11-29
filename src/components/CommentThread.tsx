import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageSquare, Pencil, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

interface Comment {
  id: string;
  content: string;
  author: string;
  snippet: string;
  parent?: string;
  created: string;
  expand?: {
    author?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  [key: string]: any; // Allow additional PocketBase fields
}

interface CommentThreadProps {
  comment: Comment;
  snippetId: string;
  depth?: number;
}

export function CommentThread({ comment, snippetId, depth = 0 }: CommentThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(true);

  // Fetch replies for this comment
  const { data: replies } = useQuery({
    queryKey: ["comments", "replies", comment.id],
    queryFn: async () => {
      return await pb.collection("comments").getList(1, 50, {
        filter: `parent = "${comment.id}"`,
        sort: "created",
        expand: "author",
      });
    },
  });

  // Fetch upvote count for this comment
  const { data: upvotes } = useQuery({
    queryKey: ["comment_upvotes", comment.id],
    queryFn: async () => {
      return await pb.collection("comment_upvotes").getList(1, 1, {
        filter: `comment = "${comment.id}"`,
      });
    },
  });

  // Check if current user upvoted this comment
  const { data: userUpvote } = useQuery({
    queryKey: ["comment_upvote", comment.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await pb.collection("comment_upvotes").getList(1, 1, {
        filter: `comment = "${comment.id}" && userid = "${user.id}"`,
      });
      return res.items[0] || null;
    },
    enabled: !!user,
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await pb.collection("comments").create({
        content,
        author: user?.id,
        snippet: snippetId,
        parent: comment.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "replies", comment.id] });
      setReplyContent("");
      setShowReplyForm(false);
      setShowReplies(true); // Auto-expand to show new reply
    },
  });

  // Toggle upvote mutation
  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      if (userUpvote) {
        return await pb.collection("comment_upvotes").delete(userUpvote.id);
      } else {
        return await pb.collection("comment_upvotes").create({
          comment: comment.id,
          userid: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment_upvotes", comment.id] });
      queryClient.invalidateQueries({ queryKey: ["comment_upvote", comment.id, user?.id] });
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // Check if comment is editable (created less than 30 minutes ago)
  const isEditable = () => {
    const created = new Date(comment.created).getTime();
    const now = Date.now();
    return now - created < 30 * 60 * 1000;
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    createReplyMutation.mutate(replyContent);
  };

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await pb.collection("comments").update(comment.id, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] }); // Invalidate all comments to refresh
      setIsEditing(false);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      return await pb.collection("comments").delete(comment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    updateCommentMutation.mutate(editContent);
  };

  const replyCount = replies?.items.length || 0;
  const maxDepth = 8; // Limit visual indentation depth
  const effectiveDepth = Math.min(depth, maxDepth);
  const paddingLeft = effectiveDepth * 2; // 2rem per level

  return (
    <div className="space-y-2">
      <div
        className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${paddingLeft}rem` }}
      >
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage
            src={
              comment.expand?.author?.avatar
                ? `${import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/files/users/${comment.expand.author.id}/${comment.expand.author.avatar}`
                : undefined
            }
          />
          <AvatarFallback className="text-xs">
            {comment.expand?.author?.name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-baseline gap-2 text-sm">
            <Link
              to={`/profile/${comment.expand?.author?.id}`}
              className="font-semibold hover:underline"
            >
              {comment.expand?.author?.name || "Unknown"}
            </Link>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(comment.created), { addSuffix: true })}
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] text-sm bg-card"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateCommentMutation.isPending || !editContent.trim()}
                >
                  {updateCommentMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {comment.content}
              {comment.updated !== comment.created && (
                <span className="text-xs text-muted-foreground ml-2">(edited)</span>
              )}
            </p>
          )}

          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleUpvoteMutation.mutate()}
              >
                <Heart className={`h-3 w-3 mr-1 ${userUpvote ? "fill-current" : ""}`} />
                {upvotes?.totalItems || 0}
              </Button>
            )}

            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {user?.id === comment.author && isEditable() && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-600"
                  onClick={() => {
                    if (confirm("Delete this comment?")) {
                      deleteCommentMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}

            {replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {showReplies ? "Hide" : "Show"} {replyCount}{" "}
                {replyCount === 1 ? "reply" : "replies"}
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="space-y-2 pt-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] text-sm bg-card"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createReplyMutation.isPending || !replyContent.trim()}
                >
                  {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Recursively render replies */}
      {showReplies &&
        replies?.items.map((reply: any) => (
          <CommentThread key={reply.id} comment={reply} snippetId={snippetId} depth={depth + 1} />
        ))}
    </div>
  );
}
