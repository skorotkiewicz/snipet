import { zodResolver } from "@hookform/resolvers/zod";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { xcodeLight } from "@uiw/codemirror-theme-xcode";
import CodeMirror from "@uiw/react-codemirror";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pb } from "@/lib/pocketbase";

const snippetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Please select a language"),
  code: z.string().min(10, "Code must be at least 10 characters"),
  visibility: z.enum(["public", "private"]),
});

import { CODE_LANGUAGES, LANGUAGE_EXTENSION_MAP } from "@/lib/utils";

type SnippetFormValues = z.infer<typeof snippetSchema>;

export function CreateSnippetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SnippetFormValues>({
    resolver: zodResolver(snippetSchema),
    defaultValues: {
      visibility: "public",
      language: "javascript",
    },
  });

  const onSubmit = async (data: SnippetFormValues) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const record = await pb.collection("snippets").create({
        ...data,
        author: user.id,
      });
      navigate(`/snippet/${record.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create snippet");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">You must be logged in to create a snippet</h1>
        <Button onClick={() => navigate("/login")}>Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Snippet</CardTitle>
          <CardDescription>Share your code with the world</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="My awesome snippet" {...register("title")} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this code do?"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {CODE_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.language && (
                  <p className="text-sm text-red-500">{errors.language.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <div className="border rounded-md overflow-hidden">
                    <CodeMirror
                      value={field.value}
                      height="300px"
                      theme={xcodeLight}
                      extensions={[
                        loadLanguage(
                          (LANGUAGE_EXTENSION_MAP as any)[watch("language")] || watch("language"),
                        ) || [],
                      ]}
                      onChange={(value) => field.onChange(value)}
                      className="text-base"
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: false,
                        highlightActiveLineGutter: false,
                        foldGutter: false,
                      }}
                    />
                  </div>
                )}
              />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Snippet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
