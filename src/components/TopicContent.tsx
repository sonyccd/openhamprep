import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicContentProps {
  content: string;
}

/**
 * A URL-friendly id from heading text, so the table of contents can link to it.
 */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** Slightly softened body text, as the prose styles had it. */
const bodyColor = (t: Theme) => tokenAlpha(t.vars.palette.text.primary, 90);

/**
 * The elements are styled once here rather than per render. They are plain
 * HTML elements, so react-markdown's own props (including `node`) pass
 * through them exactly as they did before this was on MUI.
 */
const H1 = styled("h1")({ fontSize: "1.875rem", fontWeight: 700, marginTop: 32, marginBottom: 16, scrollMarginTop: 16, // Tailwind's first: is :first-child, not :first-of-type — an h1 that is
  // not the document's first node keeps its top margin.
  "&:first-child": { marginTop: 0 } });
const H2 = styled("h2")({ fontSize: "1.5rem", fontWeight: 600, marginTop: 24, marginBottom: 12, scrollMarginTop: 16 });
const H3 = styled("h3")({ fontSize: "1.25rem", fontWeight: 600, marginTop: 16, marginBottom: 8, scrollMarginTop: 16 });
const H4 = styled("h4")({ fontSize: "1.125rem", fontWeight: 600, marginTop: 16, marginBottom: 8, scrollMarginTop: 16 });
const H5 = styled("h5")({ fontSize: "1rem", fontWeight: 600, marginTop: 16, marginBottom: 8, scrollMarginTop: 16 });
const H6 = styled("h6")({ fontSize: "0.875rem", fontWeight: 600, marginTop: 16, marginBottom: 8, scrollMarginTop: 16 });

const P = styled("p")(({ theme }) => ({ color: bodyColor(theme), lineHeight: 1.75, marginTop: 0, marginBottom: 16 }));
const Ul = styled("ul")({ listStyle: "disc inside", margin: "0 0 16px", paddingLeft: 0, "& > li + li": { marginTop: 4 } });
const Ol = styled("ol")({ listStyle: "decimal inside", margin: "0 0 16px", paddingLeft: 0, "& > li + li": { marginTop: 4 } });
const Li = styled("li")(({ theme }) => ({ color: bodyColor(theme) }));
const InlineCode = styled("code")(({ theme }) => ({
  backgroundColor: theme.vars.palette.secondary.main,
  fontFamily: "monospace",
  fontSize: "0.875rem",
  padding: "2px 6px",
  borderRadius: 4,
}));
const BlockCode = styled("code")(({ theme }) => ({
  display: "block",
  backgroundColor: theme.vars.palette.secondary.main,
  fontFamily: "monospace",
  fontSize: "0.875rem",
  padding: 16,
  borderRadius: 8,
  overflowX: "auto",
}));
const Pre = styled("pre")(({ theme }) => ({ backgroundColor: theme.vars.palette.secondary.main, borderRadius: 8, overflowX: "auto", marginBottom: 16 }));
const Blockquote = styled("blockquote")(({ theme }) => ({
  borderLeft: `4px solid ${theme.vars.palette.primary.main}`,
  paddingLeft: 16,
  fontStyle: "italic",
  color: theme.vars.palette.text.secondary,
  margin: "16px 0",
}));
const Table = styled("table")(({ theme }) => ({
  minWidth: "100%",
  borderCollapse: "collapse",
  "& tr + tr": { borderTop: `1px solid ${theme.vars.palette.divider}` },
}));
const Thead = styled("thead")(({ theme }) => ({ backgroundColor: theme.vars.palette.secondary.main }));
const Th = styled("th")({ padding: "8px 16px", textAlign: "left", fontSize: "0.875rem", fontWeight: 600 });
const Td = styled("td")(({ theme }) => ({ padding: "8px 16px", fontSize: "0.875rem", color: bodyColor(theme) }));
const Hr = styled("hr")(({ theme }) => ({ border: 0, borderTop: `1px solid ${theme.vars.palette.divider}`, margin: "24px 0" }));
const Img = styled("img")({ borderRadius: 8, maxWidth: "100%", height: "auto", margin: "16px 0" });
const A = styled("a")(({ theme }) => ({
  color: theme.vars.palette.primary.main,
  textDecoration: "underline",
  textUnderlineOffset: 4,
  "&:hover": { color: tokenAlpha(theme.vars.palette.primary.main, 80) },
}));
const Strong = styled("strong")({ fontWeight: 600 });
const Em = styled("em")({ fontStyle: "italic" });


/**
 * A topic's body, rendered from markdown.
 *
 * Every element is mapped, which is why the Tailwind typography plugin's
 * `prose` classes could go: they were already overridden for everything
 * except the headings below h3, which are now mapped too.
 */
export function TopicContent({ content }: TopicContentProps) {
  return (
    <Box component="article" sx={{ maxWidth: "none" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children, ...props }) => <H1 id={generateHeadingId(String(children))} {...props}>{children}</H1>,
          h2: ({ children, ...props }) => <H2 id={generateHeadingId(String(children))} {...props}>{children}</H2>,
          h3: ({ children, ...props }) => <H3 id={generateHeadingId(String(children))} {...props}>{children}</H3>,
          h4: ({ children, ...props }) => <H4 id={generateHeadingId(String(children))} {...props}>{children}</H4>,
          h5: ({ children, ...props }) => <H5 id={generateHeadingId(String(children))} {...props}>{children}</H5>,
          h6: ({ children, ...props }) => <H6 id={generateHeadingId(String(children))} {...props}>{children}</H6>,
          p: P,
          a: ({ children, ...props }) => (
            <A target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </A>
          ),
          ul: Ul,
          ol: Ol,
          li: Li,
          code: ({ className, children, ...props }) => {
            // A fenced block carries a language class; anything else is inline.
            const Code = className ? BlockCode : InlineCode;
            return (
              <Code className={className} {...props}>
                {children}
              </Code>
            );
          },
          pre: Pre,
          blockquote: Blockquote,
          table: ({ children, ...props }) => (
            <Box sx={{ overflowX: "auto", mb: 2 }}>
              <Table {...props}>{children}</Table>
            </Box>
          ),
          thead: Thead,
          th: Th,
          td: Td,
          hr: Hr,
          img: Img,
          strong: Strong,
          em: Em,
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
