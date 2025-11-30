import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { SnippetCardSkeleton } from "@/components/FeedSnippetCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

const FeedSnippetCard = lazy(() =>
  import("@/components/FeedSnippetCard").then((module) => ({ default: module.FeedSnippetCard })),
);

export function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      return await pb.collection("users").getOne(id!);
    },
    enabled: !!id,
  });

  const { data: snippets, isLoading } = useQuery({
    queryKey: ["snippets", "user", id],
    queryFn: async () => {
      return await pb.collection("snippets").getList(1, 50, {
        filter: `author = "${id}"`,
        sort: "-created",
        expand: "author",
      });
    },
    enabled: !!id,
  });

  const { data: likedSnippets, isLoading: isLikedLoading } = useQuery({
    queryKey: ["snippets", "liked", id],
    queryFn: async () => {
      const res = await pb.collection("upvotes").getList(1, 50, {
        filter: `userid = "${id}"`,
        sort: "-created",
        expand: "snippet,snippet.author",
      });
      // Map upvotes to snippet structure
      return {
        ...res,
        items: res.items.map((item) => ({
          ...item.expand?.snippet,
          expand: {
            author: item.expand?.snippet?.expand?.author,
          },
        })),
      };
    },
    enabled: !!id,
  });

  if (!userProfile) return <div>User not found</div>;

  const isOwnProfile = user?.id === userProfile.id;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between border rounded-lg bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={
                userProfile.avatar
                  ? `${import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/files/users/${userProfile.id}/${userProfile.avatar}`
                  : undefined
              }
            />
            <AvatarFallback className="text-2xl">{userProfile.name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{userProfile.name}</h1>
            <p className="text-muted-foreground">
              Joined {new Date(userProfile.created).toLocaleDateString()}
            </p>
            {userProfile.about && <p className="text-sm max-w-2xl mt-2">{userProfile.about}</p>}
          </div>
        </div>
        {isOwnProfile && (
          <Button asChild variant="outline">
            <Link to="/profile/edit">Edit Profile</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="created" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="created" className="flex-1">
            Created Snippets
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1">
            Liked Snippets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-6">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-6">
              {snippets?.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No snippets yet.</p>
              ) : (
                snippets?.items.map((snippet) => (
                  <Suspense key={snippet.id} fallback={<SnippetCardSkeleton />}>
                    <FeedSnippetCard key={snippet.id} snippet={snippet} />
                  </Suspense>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-6">
          {isLikedLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-6">
              {likedSnippets?.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No liked snippets yet.</p>
              ) : (
                likedSnippets?.items.map((snippet: any) => (
                  <Suspense key={snippet.id} fallback={<SnippetCardSkeleton />}>
                    <FeedSnippetCard key={snippet.id} snippet={snippet} />
                  </Suspense>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
