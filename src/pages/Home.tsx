import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router-dom";
import { SnippetCardSkeleton } from "@/components/FeedSnippetCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pb } from "@/lib/pocketbase";
import { CODE_LANGUAGES } from "@/lib/utils";

const FeedSnippetCard = lazy(() =>
  import("@/components/FeedSnippetCard").then((module) => ({ default: module.FeedSnippetCard })),
);

export function HomePage() {
  const { ref, inView } = useInView();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [languageFilter, setLanguageFilter] = useState(searchParams.get("language") || "all");

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchParams.set("search", searchQuery);
      } else {
        searchParams.delete("search");
      }
      setSearchParams(searchParams);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, setSearchParams]);

  const handleLanguageChange = (value: string) => {
    setLanguageFilter(value);
    if (value === "all") {
      searchParams.delete("language");
    } else {
      searchParams.set("language", value);
    }
    setSearchParams(searchParams);
  };

  const getFilter = () => {
    let filter = "visibility = 'public'";
    const urlSearch = searchParams.get("search");
    const urlLang = searchParams.get("language");

    if (urlSearch) {
      const safeSearch = urlSearch.replace(/"/g, '\\"');
      filter += ` && (title ~ "${safeSearch}" || description ~ "${safeSearch}" || code ~ "${safeSearch}" || language ~ "${safeSearch}" || author.name ~ "${safeSearch}")`;
    }
    if (urlLang && urlLang !== "all") {
      filter += ` && language = "${urlLang}"`;
    }
    return filter;
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["snippets", "feed", searchParams.toString()], // Refetch when params change
    queryFn: async ({ pageParam = 1 }) => {
      return await pb.collection("snippets").getList(pageParam, 5, {
        sort: "-created",
        expand: "author",
        filter: getFilter(),
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "error") {
    return <div className="text-center text-red-500">Error loading feed.</div>;
  }

  return (
    <div className="pb-20 space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search snippets..."
              className="pl-9 pr-8 bg-card h-10 transition-all focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={languageFilter} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {CODE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {status === "pending" ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {data?.pages.map((page) =>
            page.items.map((snippet) => (
              <Suspense key={snippet.id} fallback={<SnippetCardSkeleton />}>
                <FeedSnippetCard key={snippet.id} snippet={snippet} />
              </Suspense>
            )),
          )}

          {data?.pages[0].items.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No snippets found matching your criteria.
            </div>
          )}

          <div ref={ref} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : hasNextPage ? (
              <div className="h-4" />
            ) : (
              data?.pages[0].items.length !== 0 && (
                <p className="text-muted-foreground text-sm">You've reached the end!</p>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
