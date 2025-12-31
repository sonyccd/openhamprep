import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn, getSafeUrl } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  return (
    <div className={cn("text-sm text-foreground leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Paragraphs - no extra margin for compact display
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Italic
          em: ({ children }) => <em className="italic">{children}</em>,
          // Inline code
          code: ({ children, className }) => {
            // Check if this is a code block (has language class) vs inline code
            const isCodeBlock = className?.includes("language-");
            if (isCodeBlock) {
              return (
                <code className={cn("block bg-muted p-2 rounded font-mono text-xs overflow-x-auto", className)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
                {children}
              </code>
            );
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-muted p-2 rounded overflow-x-auto my-2">
              {children}
            </pre>
          ),
          // Links with external icon and safe URL validation
          a: ({ href, children }) => {
            const safeUrl = href ? getSafeUrl(href) : null;
            if (safeUrl) {
              return (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  {children}
                  <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
                </a>
              );
            }
            return <span>{children}</span>;
          },
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
