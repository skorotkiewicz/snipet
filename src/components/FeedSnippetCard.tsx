import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Heart, Lock, MessageSquare, MoreHorizontal, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

interface FeedSnippetCardProps {
  snippet: any;
}

export function FeedSnippetCard({ snippet }: FeedSnippetCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch upvote count
  const { data: upvotes } = useQuery({
    queryKey: ["snippet_upvotes", snippet.id],
    queryFn: async () => {
      const res = await pb.collection("upvotes").getList(1, 1, {
        filter: `snippet = "${snippet.id}"`,
      });
      return res.totalItems;
    },
  });

  // Fetch comment count
  const { data: commentCount } = useQuery({
    queryKey: ["snippet_comments_count", snippet.id],
    queryFn: async () => {
      const res = await pb.collection("comments").getList(1, 1, {
        filter: `snippet = "${snippet.id}"`,
      });
      return res.totalItems;
    },
  });

  // Check if current user upvoted
  const { data: userUpvote } = useQuery({
    queryKey: ["snippet_upvote", snippet.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await pb.collection("upvotes").getList(1, 1, {
        filter: `snippet = "${snippet.id}" && userid = "${user.id}"`,
      });
      return res.items[0] || null;
    },
    enabled: !!user,
  });

  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      if (userUpvote) {
        return await pb.collection("upvotes").delete(userUpvote.id);
      } else {
        return await pb.collection("upvotes").create({
          snippet: snippet.id,
          userid: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippet_upvotes", snippet.id] });
      queryClient.invalidateQueries({ queryKey: ["snippet_upvote", snippet.id, user?.id] });
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/snippet/${snippet.id}`);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${snippet.expand?.author?.id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  snippet.expand?.author?.avatar
                    ? `${import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/files/users/${snippet.expand.author.id}/${snippet.expand.author.avatar}`
                    : undefined
                }
              />
              <AvatarFallback>{snippet.expand?.author?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${snippet.expand?.author?.id}`}
                className="text-sm font-semibold hover:underline"
              >
                {snippet.expand?.author?.name || "Unknown"}
              </Link>
              {snippet.visibility === "private" && (
                <div className="flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </div>
              )}
            </div>
            <Link
              to={`/snippet/${snippet.id}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {formatDistanceToNow(new Date(snippet.created), { addSuffix: true })}
            </Link>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>Copy Link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Code Content */}
      <div className="relative group">
        <div
          className={`bg-[#1e1e1e] transition-all duration-300 ${
            isExpanded ? "" : "max-h-[400px] overflow-hidden"
          }`}
          onDoubleClick={() => user && toggleUpvoteMutation.mutate()}
        >
          <SyntaxHighlighter
            language={snippet.language}
            style={vscDarkPlus}
            // style={oneLight}
            customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.875rem" }}
            showLineNumbers
          >
            {snippet.code}
          </SyntaxHighlighter>
        </div>
        {!isExpanded && snippet.code.split("\n").length > 15 && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-4">
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 hover:bg-background"
              onClick={() => setIsExpanded(true)}
            >
              Show more
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-red-500"
              onClick={() => user && toggleUpvoteMutation.mutate()}
              disabled={!user}
            >
              <Heart className={`h-6 w-6 ${userUpvote ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Link to={`/snippet/${snippet.id}`}>
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-6 w-6" />
              </Button>
            </Link>
          </div>
          <Link to={`/snippet/${snippet.id}`}>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold">{upvotes || 0} likes</div>
          <div className="text-sm">
            <span className="font-semibold mr-2">{snippet.expand?.author?.name}</span>
            <span className="font-medium">{snippet.title}</span>
            {snippet.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2">{snippet.description}</p>
            )}
          </div>
          {(commentCount || 0) > 0 && (
            <Link
              to={`/snippet/${snippet.id}`}
              className="text-sm text-muted-foreground hover:text-foreground block mt-1"
            >
              View all {commentCount} comments
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
