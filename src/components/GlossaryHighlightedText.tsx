import { useMemo } from "react";
import { useGlossaryTerms, GlossaryTerm } from "@/hooks/useGlossaryTerms";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlossaryTermProvider, GlossaryTermTooltip } from "@/components/GlossaryTermTooltip";

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
    const termPatterns = sortedTerms.map(t => 
      t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    );
    
    if (termPatterns.length === 0) {
      return [{ text }];
    }

    // Create a map for quick term lookup (case-insensitive)
    const termMap = new Map<string, GlossaryTerm>();
    terms.forEach(t => termMap.set(t.term.toLowerCase(), t));

    const regex = new RegExp(`\\b(${termPatterns.join('|')})\\b`, 'gi');
    
    const result: TextSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index) });
      }
      
      // Add the matched term with its definition
      const matchedText = match[0];
      const term = termMap.get(matchedText.toLowerCase());
      if (term) {
        result.push({ text: matchedText, term });
      } else {
        result.push({ text: matchedText });
      }
      
      lastIndex = regex.lastIndex;
    }

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex) });
    }

    return result.length > 0 ? result : [{ text }];
  }, [text, terms]);

  return (
    <GlossaryTermProvider>
      <TooltipProvider delayDuration={200}>
        <span>
          {segments.map((segment, index) => {
            if (segment.term) {
              return (
                <GlossaryTermTooltip key={index} term={segment.term}>
                  <span
                    className="underline decoration-primary/50 decoration-dotted underline-offset-2 cursor-help text-primary/90 hover:text-primary hover:decoration-primary transition-colors"
                    role="button"
                    tabIndex={0}
                    aria-label={`${segment.term.term}: ${segment.term.definition.slice(0, 50)}${segment.term.definition.length > 50 ? '...' : ''}`}
                  >
                    {segment.text}
                  </span>
                </GlossaryTermTooltip>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </span>
      </TooltipProvider>
    </GlossaryTermProvider>
  );
}
