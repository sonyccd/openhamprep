import { useMemo } from "react";
import Box from "@mui/material/Box";
import { useGlossaryTerms, GlossaryTerm } from "@/hooks/useGlossaryTerms";
import { GlossaryTermProvider, GlossaryTermTooltip } from "@/components/GlossaryTermTooltip";
import { tokenAlpha } from "@/theme/muiTheme";

interface GlossaryHighlightedTextProps {
  text: string;
}

interface TextSegment {
  text: string;
  term?: GlossaryTerm;
}

export function GlossaryHighlightedText({ text }: GlossaryHighlightedTextProps) {
  const { data: terms = [] } = useGlossaryTerms();

  const segments = useMemo(() => {
    if (terms.length === 0) {
      return [{ text }];
    }

    // Sort terms by length (longest first) to match longer phrases before shorter ones
    const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length);

    // Build a regex pattern that matches any glossary term (case-insensitive, word boundaries)
    const termPatterns = sortedTerms.map((t) =>
      t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
    );

    if (termPatterns.length === 0) {
      return [{ text }];
    }

    // Create a map for quick term lookup (case-insensitive)
    const termMap = new Map<string, GlossaryTerm>();
    terms.forEach((t) => termMap.set(t.term.toLowerCase(), t));

    const regex = new RegExp(`\\b(${termPatterns.join("|")})\\b`, "gi");

    const result: TextSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index) });
      }

      const matchedText = match[0];
      const term = termMap.get(matchedText.toLowerCase());
      result.push(term ? { text: matchedText, term } : { text: matchedText });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex) });
    }

    return result.length > 0 ? result : [{ text }];
  }, [text, terms]);

  return (
    <GlossaryTermProvider>
      <span>
        {segments.map((segment, index) => {
          if (segment.term) {
            return (
              <GlossaryTermTooltip key={index} term={segment.term}>
                {/*
                  A real button, inline. The old trigger was a <span
                  role="button" tabIndex={0}> with no key handler, so
                  Enter and Space did nothing. The definition is attached
                  by the tooltip as this button's description; its name is
                  the word itself.
                */}
                <Box
                  component="button"
                  type="button"
                  sx={{
                    all: "unset",
                    display: "inline",
                    cursor: "help",
                    color: (t) => tokenAlpha(t.vars.palette.primary.main, 90),
                    textDecoration: "underline dotted",
                    textDecorationColor: (t) => tokenAlpha(t.vars.palette.primary.main, 50),
                    textUnderlineOffset: 2,
                    transition: "color 150ms, text-decoration-color 150ms",
                    "&:hover": { color: "primary.main", textDecorationColor: "primary.main" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2, borderRadius: "2px" },
                  }}
                >
                  {segment.text}
                </Box>
              </GlossaryTermTooltip>
            );
          }
          return <span key={index}>{segment.text}</span>;
        })}
      </span>
    </GlossaryTermProvider>
  );
}
