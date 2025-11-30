import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { xcodeLight } from "@uiw/codemirror-theme-xcode";
import { lazy, Suspense, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
// import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { loadLanguage } from "@/lib/custom-langs";
import { pb } from "@/lib/pocketbase";
import { CODE_LANGUAGES, LANGUAGE_EXTENSION_MAP } from "@/lib/utils";

const CodeMirror = lazy(() => import("@uiw/react-codemirror"));

const editSnippetSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  code: z.string().min(10, "Code must be at least 10 characters"),
});

type EditSnippetFormValues = z.infer<typeof editSnippetSchema>;

interface EditSnippetModalProps {
  snippet: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSnippetModal({ snippet, open, onOpenChange }: EditSnippetModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<EditSnippetFormValues>({
    resolver: zodResolver(editSnippetSchema),
    defaultValues: {
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      code: snippet.code,
    },
  });

  // Reset form when snippet changes
  useEffect(() => {
    if (snippet) {
      form.reset({
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        code: snippet.code,
      });
    }
  }, [snippet, form]);

  const updateSnippetMutation = useMutation({
    mutationFn: async (data: EditSnippetFormValues) => {
      // 1. Create a version snapshot of the CURRENT state (before update)
      if (data.code !== snippet.code) {
        await pb.collection("snippet_versions").create({
          snippet: snippet.id,
          code: snippet.code,
          language: snippet.language,
          description: snippet.description,
          author: snippet.author,
        });
      }

      // 2. Update the snippet with NEW data
      return await pb.collection("snippets").update(snippet.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snippet", snippet.id] });
      queryClient.invalidateQueries({ queryKey: ["snippet_versions", snippet.id] });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: EditSnippetFormValues) => {
    updateSnippetMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Edit Snippet</DialogTitle>
          <DialogDescription>
            Make changes to your snippet. A new version will be saved in history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                onValueChange={(value) => form.setValue("language", value)}
                defaultValue={snippet.language}
              >
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
              {form.formState.errors.language && (
                <p className="text-sm text-red-500">{form.formState.errors.language.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your snippet..."
              className="min-h-[100px] bg-card"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Controller
              name="code"
              control={form.control}
              render={({ field }) => (
                <div className="border rounded-md overflow-hidden">
                  <Suspense
                    fallback={
                      <div className="h-[300px] w-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                        Loading editor...
                      </div>
                    }
                  >
                    <CodeMirror
                      value={field.value}
                      height="300px"
                      extensions={[
                        loadLanguage(
                          (LANGUAGE_EXTENSION_MAP as any)[form.watch("language")] ||
                            form.watch("language"),
                        ) || [],
                      ]}
                      theme={xcodeLight}
                      onChange={(value) => field.onChange(value)}
                      className="text-base"
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: false,
                        highlightActiveLineGutter: false,
                        foldGutter: false,
                      }}
                    />
                  </Suspense>
                </div>
              )}
            />{" "}
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateSnippetMutation.isPending}>
              {updateSnippetMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
