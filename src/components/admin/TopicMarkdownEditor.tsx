import { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { useSaveTopicContent, useUploadTopicImage } from "@/hooks/useTopicContentEditor";
import { EditorToolbar } from "./topics/EditorToolbar";
import { MarkdownPreviewPane } from "./topics/MarkdownPreviewPane";
import { defaultTopicContent, insertAtSelection } from "./topics/defaultTopicContent";

interface TopicMarkdownEditorProps {
  topicId: string;
  topicSlug: string;
  initialContent: string | null;
  onSave?: () => void;
}

export function TopicMarkdownEditor({ topicId, topicSlug, initialContent, onSave }: TopicMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startingContent = initialContent || defaultTopicContent(topicSlug);
  const [content, setContent] = useState(startingContent);
  const [savedContent, setSavedContent] = useState(startingContent);
  const hasChanges = content !== savedContent;

  const save = useSaveTopicContent(topicId, topicSlug);
  const upload = useUploadTopicImage();

  // Switching topics replaces the document; edits to the previous one are gone.
  const prevTopicIdRef = useRef(topicId);
  useEffect(() => {
    if (prevTopicIdRef.current === topicId) return;
    const next = initialContent || defaultTopicContent(topicSlug);
    setContent(next);
    setSavedContent(next);
    prevTopicIdRef.current = topicId;
  }, [topicId, initialContent, topicSlug]);

  const handleSave = useCallback(() => {
    save.mutate(content, {
      onSuccess: () => {
        setSavedContent(content);
        toast.success("Content saved successfully");
        onSave?.();
      },
      onError: (error) => toast.error("Failed to save content: " + error.message),
    });
  }, [save, content, onSave]);

  const handleImagePicked = (file: File) => {
    upload.mutate(file, {
      onSuccess: (publicUrl) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { value, caret } = insertAtSelection(
          content,
          textarea.selectionStart,
          textarea.selectionEnd,
          `![${file.name}](${publicUrl})`
        );
        setContent(value);
        // After React has written the new value.
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = caret;
          textarea.focus();
        }, 0);
        toast.success("Image uploaded successfully");
      },
      onError: (error) => toast.error(error.message),
    });
  };

  // Ctrl/Cmd+S saves, when there is something to save.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges && !save.isPending) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, save.isPending, handleSave]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <EditorToolbar
        hasChanges={hasChanges}
        isSaving={save.isPending}
        isUploading={upload.isPending}
        onSave={handleSave}
        onImagePicked={handleImagePicked}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Typography component="label" htmlFor="topic-markdown" sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>
            Markdown
          </Typography>
          <Box
            component="textarea"
            id="topic-markdown"
            ref={textareaRef}
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Enter markdown..."
            spellCheck={false}
            sx={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              p: 2,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              color: "text.primary",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              resize: "none",
              "&:focus": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -1 },
            }}
          />
        </Box>

        <MarkdownPreviewPane content={content} />
      </Box>

      <Typography sx={{ mt: 1, fontSize: "0.75rem", color: "text.secondary", flexShrink: 0 }}>
        Write markdown on the left, see the preview on the right. Math: $inline$ or $$block$$. Press Ctrl+S to save.
      </Typography>
    </Box>
  );
}
