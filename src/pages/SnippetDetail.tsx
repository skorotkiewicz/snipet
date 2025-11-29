import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { GitFork, Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

export function SnippetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: snippet, isLoading } = useQuery({
    queryKey: ["snippet", id],
    queryFn: async () => {
      return await pb.collection("snippets").getOne(id!, {
        expand: "author,forked_from",
      });
    },
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      return await pb.collection("comments").getList(1, 50, {
        filter: `snippet = "${id}"`,
        sort: "-created",
        expand: "author",
      });
    },
    enabled: !!id,
  });

  const { data: upvotes } = useQuery({
    queryKey: ["upvotes", id],
    queryFn: async () => {
      return await pb.collection("upvotes").getList(1, 1, {
        filter: `snippet = "${id}"`,
      });
      // Note: Ideally we get count. PB getList returns totalItems.
    },
    enabled: !!id,
  });

  // Check if current user upvoted
  const { data: userUpvote } = useQuery({
    queryKey: ["upvote", id, user?.id],
    queryFn: async () => {
      const res = await pb.collection("upvotes").getList(1, 1, {
        filter: `snippet = "${id}" && userid = "${user?.id}"`,
      });
      return res.items[0] || null;
    },
    enabled: !!id && !!user,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await pb.collection("comments").create({
        content,
        snippet: id,
        author: user?.id,
      });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const toggleUpvoteMutation = useMutation({
    mutationFn: async () => {
      if (userUpvote) {
        return await pb.collection("upvotes").delete(userUpvote.id);
      } else {
        return await pb.collection("upvotes").create({
          snippet: id,
          userid: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upvotes", id] });
      queryClient.invalidateQueries({ queryKey: ["upvote", id, user?.id] });
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async () => {
      return await pb.collection("snippets").delete(id!);
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleFork = () => {
    // Navigate to create page with pre-filled data or handle fork logic directly
    // Ideally we create a new snippet with 'forked_from' set to this id
    // For now, let's just navigate to a "fork" page or use state to pass data to create page
    // Simpler: Create the record immediately and redirect to edit it?
    // Or: Go to /new?fork=id
    // Let's go with /new?fork=id approach in a real app, but for now I'll just implement a direct fork action
    // actually, let's just create it.
    forkMutation.mutate();
  };

  const forkMutation = useMutation({
    mutationFn: async () => {
      return await pb.collection("snippets").create({
        title: `Fork of ${snippet?.title}`,
        code: snippet?.code,
        language: snippet?.language,
        description: snippet?.description,
        visibility: "public",
        author: user?.id,
        forked_from: id,
      });
    },
    onSuccess: (newSnippet) => {
      navigate(`/snippet/${newSnippet.id}`);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!snippet) return <div>Snippet not found</div>;

  const isAuthor = user?.id === snippet.author;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{snippet.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <span>by {snippet.expand?.author?.name || "Unknown"}</span>
            <span>•</span>
            <span>{new Date(snippet.created).toLocaleDateString()}</span>
            {snippet.expand?.forked_from && (
              <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                <GitFork className="w-3 h-3" /> Forked from {snippet.expand.forked_from.title}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFork}
                disabled={forkMutation.isPending}
              >
                <GitFork className="w-4 h-4 mr-2" /> Fork
              </Button>
              <Button
                variant={userUpvote ? "default" : "outline"}
                size="sm"
                onClick={() => toggleUpvoteMutation.mutate()}
              >
                <Heart className={`w-4 h-4 mr-2 ${userUpvote ? "fill-current" : ""}`} />
                {upvotes?.totalItems || 0}
              </Button>
            </>
          )}
          {isAuthor && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to delete this snippet?")) {
                  deleteSnippetMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md overflow-hidden border">
        <SyntaxHighlighter
          language={snippet.language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: 0 }}
          showLineNumbers
        >
          {snippet.code}
        </SyntaxHighlighter>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Description</h3>
        <p className="whitespace-pre-wrap">{snippet.description || "No description."}</p>
      </div>

      <div className="space-y-6 pt-6 border-t">
        <h3 className="text-xl font-semibold">Comments ({comments?.totalItems || 0})</h3>

        {user && (
          <div className="flex gap-4">
            <Textarea
              placeholder="Leave a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={() => createCommentMutation.mutate(comment)}
              disabled={!comment.trim() || createCommentMutation.isPending}
            >
              Post
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {comments?.items.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-lg border bg-card">
              <Avatar>
                <AvatarImage
                  src={`http://127.0.0.1:8090/api/files/users/${comment.author}/${comment.expand?.author?.avatar}`}
                />
                <AvatarFallback>{comment.expand?.author?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comment.expand?.author?.name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
