import { useQuery } from "@tanstack/react-query";
import { Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

interface SnippetCardProps {
  snippet: any; // Type this properly later
}

export function SnippetCard({ snippet }: SnippetCardProps) {
  // Fetch upvote count for this snippet
  const { data: upvotes } = useQuery({
    queryKey: ["snippet_upvotes", snippet.id],
    queryFn: async () => {
      const res = await pb.collection("upvotes").getList(1, 1, {
        filter: `snippet = "${snippet.id}"`,
      });
      return res.totalItems;
    },
  });

  // Fetch comment count for this snippet
  const { data: commentCount } = useQuery({
    queryKey: ["snippet_comments_count", snippet.id],
    queryFn: async () => {
      const res = await pb.collection("comments").getList(1, 1, {
        filter: `snippet = "${snippet.id}"`,
      });
      return res.totalItems;
    },
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            <Link to={`/snippet/${snippet.id}`} className="hover:underline">
              {snippet.title}
            </Link>
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {snippet.language}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {snippet.description || "No description provided."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" /> {upvotes || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {commentCount || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            by{" "}
            <Link to={`/profile/${snippet.expand?.author?.id}`} className="hover:underline">
              {snippet.expand?.author?.name || "Unknown"}
            </Link>
          </span>
          <span>•</span>
          <span>{formatDate(snippet.created)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
