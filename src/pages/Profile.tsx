import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { SnippetCard } from "@/components/SnippetCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

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

  if (!userProfile) return <div>User not found</div>;

  const isOwnProfile = user?.id === userProfile.id;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={`http://127.0.0.1:8090/api/files/users/${userProfile.id}/${userProfile.avatar}`}
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

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Snippets</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {snippets?.items.length === 0 ? (
              <p className="text-muted-foreground">No snippets yet.</p>
            ) : (
              snippets?.items.map((snippet) => <SnippetCard key={snippet.id} snippet={snippet} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
