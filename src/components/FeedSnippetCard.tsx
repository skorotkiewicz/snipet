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

  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/snippet/${snippet.id}`);
    alert("Link copied to clipboard!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippet.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
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
            <DropdownMenuItem onClick={handleCopyCode}>Copy Code</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Code Content */}
      <div className="relative group">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs bg-background/80 hover:bg-background shadow-sm transition-all w-16"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode();
            }}
          >
            {isCopied ? "Copied!" : "Copy"}
          </Button>
        </div>
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

      {/* Footer Actions & Details */}
      <div className="p-4 space-y-4">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 pl-0 hover:bg-transparent ${userUpvote ? "text-red-500 hover:text-red-600" : "hover:text-red-500"}`}
              onClick={() => user && toggleUpvoteMutation.mutate()}
              disabled={!user}
            >
              <Heart className={`h-5 w-5 ${userUpvote ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{upvotes || 0}</span>
            </Button>

            <Link to={`/snippet/${snippet.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 hover:bg-transparent hover:text-blue-500"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-medium">{commentCount || 0}</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 hover:bg-transparent hover:text-green-500"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium uppercase">
            {snippet.language}
          </div>
        </div>

        {/* Content Details */}
        <div className="space-y-1">
          <Link to={`/snippet/${snippet.id}`} className="block group">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {snippet.title}
            </h3>
          </Link>
          {snippet.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{snippet.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
