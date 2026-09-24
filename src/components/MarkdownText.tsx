import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import type { SxProps, Theme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ExternalLink } from "lucide-react";
import { getSafeUrl } from "@/lib/utils";

interface MarkdownTextProps {
  text: string;
  sx?: SxProps<Theme>;
}

const codeSx = { fontFamily: "monospace", fontSize: "0.75rem", bgcolor: "muted", borderRadius: "4px" } as const;

/**
 * A short piece of markdown — an explanation or a note — rendered compactly.
 *
 * Every element is mapped, so the surrounding page's typography does not leak
 * in and nothing here depends on a stylesheet.
 */
export function MarkdownText({ text, sx }: MarkdownTextProps) {
  return (
    <Box sx={[{ fontSize: "0.875rem", lineHeight: 1.625 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <Box component="p" sx={{ m: 0, mb: 1, "&:last-child": { mb: 0 } }}>{children}</Box>,
          strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 600 }}>{children}</Box>,
          em: ({ children }) => <Box component="em" sx={{ fontStyle: "italic" }}>{children}</Box>,
          code: ({ children, className }) => {
            // A language class means a fenced block; anything else is inline.
            const isCodeBlock = className?.includes("language-");
            return isCodeBlock ? (
              <Box component="code" sx={{ ...codeSx, display: "block", p: 1, overflowX: "auto" }}>
                {children}
              </Box>
            ) : (
              <Box component="code" sx={{ ...codeSx, px: 0.75, py: 0.25 }}>
                {children}
              </Box>
            );
          },
          pre: ({ children }) => (
            <Box component="pre" sx={{ bgcolor: "muted", p: 1, borderRadius: "4px", overflowX: "auto", my: 1 }}>
              {children}
            </Box>
          ),
          a: ({ href, children }) => {
            // Anything that is not a safe http(s) URL renders as plain text.
            const safeUrl = href ? getSafeUrl(href) : null;
            if (!safeUrl) return <span>{children}</span>;
            return (
              <Link
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                // MUI underlines always by default; this was hover-only.
                underline="hover"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
              >
                {children}
                <Icon icon={ExternalLink} size={12} sx={{ flexShrink: 0 }} />
              </Link>
            );
          },
          ul: ({ children }) => (
            <Box component="ul" sx={{ listStyle: "disc inside", m: 0, mb: 1, pl: 0, "& > li + li": { mt: 0.5 } }}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" sx={{ listStyle: "decimal inside", m: 0, mb: 1, pl: 0, "& > li + li": { mt: 0.5 } }}>
              {children}
            </Box>
          ),
          blockquote: ({ children }) => (
            <Box
              component="blockquote"
              sx={{ borderLeft: "2px solid", borderColor: "primary.main", pl: 1.5, fontStyle: "italic", color: "text.secondary", my: 1, mx: 0 }}
            >
              {children}
            </Box>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
}
