import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// MDXEditor imports
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
  Separator,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface TopicMarkdownEditorProps {
  topicId: string;
  topicSlug: string;
  initialContent: string | null;
  onSave?: () => void;
}

export function TopicMarkdownEditor({
  topicId,
  topicSlug,
  initialContent: initialContentProp,
  onSave,
}: TopicMarkdownEditorProps) {
  const queryClient = useQueryClient();
  const editorRef = useRef<MDXEditorMethods>(null);
  const { theme, resolvedTheme } = useTheme();

  // Determine if dark mode is active
  const isDarkMode = resolvedTheme === "dark" || theme === "dark";

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

  // Initialize content from prop or default
  const startingContent = initialContentProp || getDefaultContent(topicSlug);
  const [content, setContent] = useState(startingContent);
  const [savedContent, setSavedContent] = useState(startingContent);
  const [hasChanges, setHasChanges] = useState(false);

  // Track current topic to detect topic switches
  const prevTopicIdRef = useRef(topicId);

  // Only reset state when switching to a DIFFERENT topic
  // This prevents losing local state when component remounts (e.g., tab switch)
  useEffect(() => {
    if (prevTopicIdRef.current !== topicId) {
      // Switched to a different topic - reset everything
      const newContent = initialContentProp || getDefaultContent(topicSlug);
      setContent(newContent);
      setSavedContent(newContent);
      setHasChanges(false);
      // Update editor content programmatically
      editorRef.current?.setMarkdown(newContent);
      prevTopicIdRef.current = topicId;
    }
  }, [topicId, initialContentProp, topicSlug]);

  // Image upload handler for Supabase Storage (images still go to storage)
  const imageUploadHandler = async (image: File): Promise<string> => {
    const fileExt = image.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `topic-images/${fileName}`;

    const { error } = await supabase.storage
      .from("topic-content")
      .upload(filePath, image, {
        contentType: image.type,
        upsert: false,
      });

    if (error) {
      toast.error("Failed to upload image: " + error.message);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("topic-content").getPublicUrl(filePath);

    toast.success("Image uploaded successfully");
    return publicUrl;
  };

  // Save content to database
  const saveMutation = useMutation({
    mutationFn: async (markdownContent: string) => {
      const { error } = await supabase
        .from("topics")
        .update({
          content: markdownContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", topicSlug] });
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-topic-detail", topicId] });
      setHasChanges(false);
      setSavedContent(content);
      toast.success("Content saved successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error("Failed to save content: " + error.message);
    },
  });

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      setHasChanges(value !== savedContent);
    },
    [savedContent]
  );

  const handleSave = useCallback(() => {
    saveMutation.mutate(content);
  }, [saveMutation, content]);

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
  }, [hasChanges, saveMutation.isPending, handleSave]);

  // MDXEditor plugins configuration
  const editorPlugins = [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin({
      imageUploadHandler,
      disableImageResize: false,
    }),
    tablePlugin(),
    thematicBreakPlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
    markdownShortcutPlugin(),
    diffSourcePlugin({ viewMode: "rich-text" }),
    toolbarPlugin({
      toolbarContents: () => (
        <>
          <UndoRedo />
          <Separator />
          <BoldItalicUnderlineToggles />
          <CodeToggle />
          <Separator />
          <BlockTypeSelect />
          <Separator />
          <ListsToggle />
          <Separator />
          <CreateLink />
          <InsertImage />
          <InsertTable />
          <InsertThematicBreak />
          <Separator />
          <InsertCodeBlock />
          <Separator />
          <DiffSourceToggleWrapper />
        </>
      ),
    }),
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Content Editor</h3>
          {hasChanges && (
            <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">
              Unsaved changes
            </span>
          )}
        </div>
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

      {/* Editor Area */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border">
        <MDXEditor
          ref={editorRef}
          markdown={content}
          onChange={handleContentChange}
          className={cn(
            "h-full [&_.mdxeditor]:h-full",
            isDarkMode && "dark-theme"
          )}
          contentEditableClassName="prose prose-slate dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none"
          plugins={editorPlugins}
        />
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground shrink-0">
        Use the toolbar for formatting. Math expressions ($inline$ or $$block$$)
        will render when viewing the topic. Press Ctrl+S to save.
      </div>
    </div>
  );
}
