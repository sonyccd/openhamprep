import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2, FileText, ImagePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Allowed image MIME types for upload validation
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  // Image upload handler for Supabase Storage
  const handleImageUpload = useCallback(
    async (file: File) => {
      // Validate MIME type to prevent uploading non-image files
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(
          `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, GIF, WebP, SVG`
        );
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `topic-images/${fileName}`;

      const { error } = await supabase.storage
        .from("topic-content")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        toast.error("Failed to upload image: " + error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("topic-content").getPublicUrl(filePath);

      // Insert markdown image syntax at cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imageMarkdown = `![${file.name}](${publicUrl})`;
        const newContent =
          content.substring(0, start) + imageMarkdown + content.substring(end);
        setContent(newContent);
        setHasChanges(newContent !== savedContent);

        // Set cursor position after inserted text
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          textarea.focus();
        }, 0);
      }

      toast.success("Image uploaded successfully");
    },
    [content, savedContent]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
      // Reset input so same file can be uploaded again
      e.target.value = "";
    },
    [handleImageUpload]
  );

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
      queryClient.invalidateQueries({
        queryKey: ["admin-topic-detail", topicId],
      });
      setHasChanges(false);
      setSavedContent(content);
      toast.success("Content saved successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error("Failed to save content: " + error.message);
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate(content);
  }, [saveMutation, content]);

  // Handle content changes
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setHasChanges(newContent !== savedContent);
    },
    [savedContent]
  );

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

  // Handle topic switching - update content
  useEffect(() => {
    if (prevTopicIdRef.current !== topicId) {
      const newContent = initialContentProp || getDefaultContent(topicSlug);
      setContent(newContent);
      setSavedContent(newContent);
      setHasChanges(false);
      prevTopicIdRef.current = topicId;
    }
  }, [topicId, initialContentProp, topicSlug]);

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
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Image
          </Button>
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

      {/* Split Pane Editor */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Left: Raw Markdown Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-xs text-muted-foreground mb-2">Markdown</div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            className="flex-1 min-h-0 w-full p-4 rounded-lg border border-border bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter markdown..."
            spellCheck={false}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-xs text-muted-foreground mb-2">Preview</div>
          <div className="flex-1 min-h-0 overflow-auto p-4 rounded-lg border border-border bg-card">
            <div className="markdown-preview">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-muted-foreground shrink-0">
        Write markdown on the left, see the preview on the right. Math: $inline$ or $$block$$. Press Ctrl+S to save.
      </div>
    </div>
  );
}
