import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

interface MarkdownPreviewPaneProps {
  content: string;
}

/**
 * The rendered half of the split editor. The `markdown-preview` class is
 * the typography for rendered topic content in index.css, shared with the
 * public TopicContent — a deliberate mix, not a leftover.
 */
export function MarkdownPreviewPane({ content }: MarkdownPreviewPaneProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Typography component="div" sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>
        Preview
      </Typography>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          p: 2,
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        </div>
      </Box>
    </Box>
  );
}
