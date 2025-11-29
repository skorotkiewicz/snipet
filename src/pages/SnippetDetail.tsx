import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitFork, Heart, History, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CommentThread } from "@/components/CommentThread";
import { DiffView } from "@/components/DiffView";
import { EditSnippetModal } from "@/components/EditSnippetModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

export function SnippetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

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
        filter: `snippet = "${id}" && parent = null`,
        sort: "created",
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

  // Fetch versions history
  const { data: versions } = useQuery({
    queryKey: ["snippet_versions", id],
    queryFn: async () => {
      // Fetch versions for this snippet
      const currentVersions = await pb.collection("snippet_versions").getList(1, 50, {
        filter: `snippet = "${id}"`,
        sort: "-created",
        expand: "author",
      });

      // If forked, we could fetch parent versions too, but for now let's stick to this snippet's history
      // as requested "see all versions from previous works" might imply recursive fetching
      // Let's try to fetch parent versions if forked
      let allVersions = [...currentVersions.items];

      if (snippet?.forked_from) {
        try {
          const parentVersions = await pb.collection("snippet_versions").getList(1, 50, {
            filter: `snippet = "${snippet.forked_from}"`,
            sort: "-created",
            expand: "author",
          });
          // Mark them as from parent
          const parentItems = parentVersions.items.map((v) => ({ ...v, isParent: true }));
          allVersions = [...allVersions, ...parentItems];
        } catch (e) {
          console.log("Could not fetch parent versions", e);
        }
      }

      // Sort all by created desc
      return allVersions.sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      );
    },
    enabled: !!id && !!snippet,
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
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{snippet.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              by{" "}
              <Link
                to={`/profile/${snippet.expand?.author?.id}`}
                className="font-medium hover:underline text-foreground"
              >
                {snippet.expand?.author?.name}
              </Link>
            </span>
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
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await pb.collection("snippets").update(snippet.id, {
                    visibility: snippet.visibility === "public" ? "private" : "public",
                  });
                  queryClient.invalidateQueries({ queryKey: ["snippet", id] });
                }}
              >
                {snippet.visibility === "public" ? "Make Private" : "Make Public"}
              </Button>
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
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="code" className="w-full">
        <TabsList>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="history">History ({versions?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4 space-y-6">
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
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-2">
              <div
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${!selectedVersion ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
                onClick={() => setSelectedVersion(null)}
              >
                <div className="font-semibold">Current Version</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(snippet.updated).toLocaleString()}
                </div>
                <div className="text-xs mt-1">by {snippet.expand?.author?.name}</div>
              </div>

              {versions?.map((version: any) => (
                <div
                  key={version.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVersion?.id === version.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Version</span>
                    {version.isParent && (
                      <span className="text-[10px] bg-muted px-1 rounded">Parent</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(version.created).toLocaleString()}
                  </div>
                  <div className="text-xs mt-1">by {version.expand?.author?.name}</div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              {selectedVersion ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">
                      Comparing Current vs {new Date(selectedVersion.created).toLocaleDateString()}
                    </h3>
                  </div>
                  <DiffView
                    oldCode={selectedVersion.code}
                    newCode={snippet.code}
                    language={snippet.language}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 border rounded-lg border-dashed">
                  <History className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a version from the list to see changes</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
          {comments?.items.length === 0 ? (
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          ) : (
            comments?.items.map((comment: any) => (
              <CommentThread key={comment.id} comment={comment} snippetId={id!} />
            ))
          )}
        </div>
      </div>

      <EditSnippetModal
        snippet={snippet}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  );
}
