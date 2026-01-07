import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, Eye, Edit3, FileText } from "lucide-react";
import { TopicContent } from "@/components/TopicContent";
import { useTopicContent } from "@/hooks/useTopics";
import { cn } from "@/lib/utils";

interface TopicMarkdownEditorProps {
  topicId: string;
  topicSlug: string;
  contentPath: string | null;
  onSave?: () => void;
}

export function TopicMarkdownEditor({
  topicId,
  topicSlug,
  contentPath,
  onSave,
}: TopicMarkdownEditorProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("split");

  // Fetch existing content
  const { data: existingContent, isLoading: contentLoading, isFetching } = useTopicContent(contentPath);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize content when loaded
  useEffect(() => {
    if (existingContent !== undefined && !isInitialized) {
      setContent(existingContent || getDefaultContent(topicSlug));
      setHasChanges(false);
      setIsInitialized(true);
    }
  }, [existingContent, topicSlug, isInitialized]);

  const getDefaultContent = (slug: string) => {
    const title = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return `# ${title}

## Introduction

Write your introduction here. This section should give readers an overview of what they'll learn.

## Main Content

Add your main content here. You can use:

- **Bold text** for emphasis
- *Italic text* for terms
- \`code\` for technical terms
- [Links](https://example.com) to external resources

### Subsection

Break down complex topics into subsections.

## Key Points

1. First key point
2. Second key point
3. Third key point

## Summary

Wrap up the topic with a brief summary of what was covered.
`;
  };

  const saveMutation = useMutation({
    mutationFn: async (markdownContent: string) => {
      const path = contentPath || `articles/${topicSlug}.md`;

      // Convert string to blob for upload
      const blob = new Blob([markdownContent], { type: "text/markdown" });

      // Try to delete existing file first (in case of update)
      await supabase.storage.from("topic-content").remove([path]);

      // Upload the new content
      const { error } = await supabase.storage
        .from("topic-content")
        .upload(path, blob, {
          contentType: "text/markdown",
          upsert: true,
        });

      if (error) throw error;

      // Update the topic's content_path if it wasn't set
      if (!contentPath) {
        const { error: updateError } = await supabase
          .from("topics")
          .update({ content_path: path })
          .eq("id", topicId);

        if (updateError) throw updateError;
      }

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-content", contentPath] });
      queryClient.invalidateQueries({ queryKey: ["topic", topicSlug] });
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      setHasChanges(false);
      toast.success("Content saved successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error("Failed to save content: " + error.message);
    },
  });

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    saveMutation.mutate(content);
  };

  // Keyboard shortcut for save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !saveMutation.isPending) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saveMutation.isPending]);

  // Only show full-screen loading on initial load (not cached)
  const showInitialLoading = contentLoading && !isInitialized && !content;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Content Editor</h3>
          {isFetching && isInitialized && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {hasChanges && (
            <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs px-2 h-6">
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="split" className="text-xs px-2 h-6">
                Split
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-2 h-6">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {showInitialLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading content...</p>
          </div>
        ) : (
          <>
            {activeTab === "edit" && (
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full resize-none font-mono text-sm"
                placeholder="Write your markdown content here..."
              />
            )}

            {activeTab === "preview" && (
              <div className="h-full overflow-y-auto p-4 bg-background rounded-lg border border-border">
                <TopicContent content={content} />
              </div>
            )}

            {activeTab === "split" && (
              <div className="grid grid-cols-2 gap-4 h-full">
                <Textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full resize-none font-mono text-sm"
                  placeholder="Write your markdown content here..."
                />
                <div className="h-full overflow-y-auto p-4 bg-background rounded-lg border border-border">
                  <TopicContent content={content} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground shrink-0">
        Supports Markdown: **bold**, *italic*, `code`, [links](url), # headings, - lists, and math: $inline$ or $$block$$.
        Press Ctrl+S to save.
      </div>
    </div>
  );
}
