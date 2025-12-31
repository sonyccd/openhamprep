import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface TopicContentProps {
  content: string;
}

export function TopicContent({ content }: TopicContentProps) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with IDs for TOC linking
          h1: ({ children, ...props }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-");
            return (
              <h1
                id={id}
                className="text-3xl font-bold text-foreground mt-8 mb-4 first:mt-0 scroll-mt-4"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2: ({ children, ...props }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-");
            return (
              <h2
                id={id}
                className="text-2xl font-semibold text-foreground mt-6 mb-3 scroll-mt-4"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-");
            return (
              <h3
                id={id}
                className="text-xl font-semibold text-foreground mt-4 mb-2 scroll-mt-4"
                {...props}
              >
                {children}
              </h3>
            );
          },
          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="text-foreground/90 leading-7 mb-4" {...props}>
              {children}
            </p>
          ),
          // Links
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
              {...props}
            >
              {children}
            </a>
          ),
          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-foreground/90" {...props}>
              {children}
            </li>
          ),
          // Code blocks
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "block bg-secondary p-4 rounded-lg text-sm font-mono overflow-x-auto",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              className="bg-secondary rounded-lg overflow-x-auto mb-4"
              {...props}
            >
              {children}
            </pre>
          ),
          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="min-w-full divide-y divide-border"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-secondary" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-2 text-left text-sm font-semibold text-foreground"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-sm text-foreground/90" {...props}>
              {children}
            </td>
          ),
          // Horizontal rule
          hr: ({ ...props }) => (
            <hr className="border-border my-6" {...props} />
          ),
          // Images
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg max-w-full h-auto my-4"
              {...props}
            />
          ),
          // Strong/Bold
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          // Emphasis/Italic
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
