import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SnippetCard } from "@/components/SnippetCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pb } from "@/lib/pocketbase";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "html",
  "css",
  "json",
  "sql",
];

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const languageFilter = searchParams.get("language") || "all";

  const getFilter = () => {
    let filter = "visibility = 'public'";
    if (searchQuery) {
      filter += ` && title ~ "${searchQuery}"`;
    }
    if (languageFilter && languageFilter !== "all") {
      filter += ` && language = "${languageFilter}"`;
    }
    return filter;
  };

  const { data: newestSnippets, isLoading: isNewestLoading } = useQuery({
    queryKey: ["snippets", "newest", searchQuery, languageFilter],
    queryFn: async () => {
      return await pb.collection("snippets").getList(1, 20, {
        sort: "-created",
        expand: "author",
        filter: getFilter(),
      });
    },
  });

  const { data: popularSnippets, isLoading: isPopularLoading } = useQuery({
    queryKey: ["snippets", "popular", searchQuery, languageFilter],
    queryFn: async () => {
      return await pb.collection("snippets").getList(1, 20, {
        sort: "-created",
        expand: "author",
        filter: getFilter(),
      });
    },
  });

  const handleLanguageChange = (value: string) => {
    if (value === "all") {
      searchParams.delete("language");
    } else {
      searchParams.set("language", value);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Discover Snippets</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore, share, and fork code snippets from the community.
          </p>
        </div>
        <div className="w-[200px]">
          <Select value={languageFilter} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {searchQuery && <div className="text-lg">Results for "{searchQuery}"</div>}

      <Tabs defaultValue="newest" className="w-full">
        <TabsList>
          <TabsTrigger value="newest">Newest</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>
        <TabsContent value="newest" className="mt-6">
          {isNewestLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newestSnippets?.items.length === 0 ? (
                <p>No snippets found.</p>
              ) : (
                newestSnippets?.items.map((snippet) => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="popular" className="mt-6">
          {isPopularLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {popularSnippets?.items.length === 0 ? (
                <p>No snippets found.</p>
              ) : (
                popularSnippets?.items.map((snippet) => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
