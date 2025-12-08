import { cn } from "@/lib/utils";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  // Clean up LaTeX-style formatting artifacts
  const cleanLatex = (input: string): string => {
    let cleaned = input;
    
    // Remove $ ext{...}$ patterns, keeping the content
    cleaned = cleaned.replace(/\$\s*\\?ext\{([^}]*)\}\s*\$/g, '$1');
    
    // Remove $\text{...}$ patterns (alternate spelling)
    cleaned = cleaned.replace(/\$\s*\\?text\{([^}]*)\}\s*\$/g, '$1');
    
    // Remove simple $...$ math delimiters but keep content
    cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');
    
    // Remove standalone ext{...} or \ext{...} patterns (after $ removal)
    cleaned = cleaned.replace(/\\?ext\{\s*([^}]*)\s*\}/g, '$1');
    
    // Remove standalone \text{...} patterns (after $ removal)
    cleaned = cleaned.replace(/\\?text\{\s*([^}]*)\s*\}/g, '$1');
    
    // Clean up any remaining backslash commands like \times
    cleaned = cleaned.replace(/\\times/g, '×');
    cleaned = cleaned.replace(/\\div/g, '÷');
    cleaned = cleaned.replace(/\\pm/g, '±');
    cleaned = cleaned.replace(/\\approx/g, '≈');
    cleaned = cleaned.replace(/\\neq/g, '≠');
    cleaned = cleaned.replace(/\\leq/g, '≤');
    cleaned = cleaned.replace(/\\geq/g, '≥');
    cleaned = cleaned.replace(/\\infty/g, '∞');
    cleaned = cleaned.replace(/\\pi/g, 'π');
    cleaned = cleaned.replace(/\\Omega/g, 'Ω');
    cleaned = cleaned.replace(/\\mu/g, 'μ');
    cleaned = cleaned.replace(/\\ohm/g, 'Ω');
    cleaned = cleaned.replace(/\\cdot/g, '·');
    cleaned = cleaned.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2');
    
    return cleaned;
  };

  // Parse markdown-style formatting
  const parseMarkdown = (input: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = cleanLatex(input);
    let key = 0;

    while (remaining.length > 0) {
      // Check for bold (**text** or __text__)
      const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
      if (boldMatch) {
        elements.push(
          <strong key={key++} className="font-semibold text-foreground">
            {boldMatch[2]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for superscript with braces (^{text})
      const superBraceMatch = remaining.match(/^\^\{([^}]+)\}/);
      if (superBraceMatch) {
        elements.push(
          <sup key={key++} className="text-xs">
            {superBraceMatch[1]}
          </sup>
        );
        remaining = remaining.slice(superBraceMatch[0].length);
        continue;
      }

      // Check for superscript single character (^2, ^n, etc.)
      const superMatch = remaining.match(/^\^([0-9a-zA-Z])/);
      if (superMatch) {
        elements.push(
          <sup key={key++} className="text-xs">
            {superMatch[1]}
          </sup>
        );
        remaining = remaining.slice(superMatch[0].length);
        continue;
      }

      // Check for subscript with braces (_{text})
      const subBraceMatch = remaining.match(/^_\{([^}]+)\}/);
      if (subBraceMatch) {
        elements.push(
          <sub key={key++} className="text-xs">
            {subBraceMatch[1]}
          </sub>
        );
        remaining = remaining.slice(subBraceMatch[0].length);
        continue;
      }

      // Check for subscript single character (_2, _n, etc.) - but not before letters (to avoid breaking italic)
      const subMatch = remaining.match(/^_([0-9])/);
      if (subMatch) {
        elements.push(
          <sub key={key++} className="text-xs">
            {subMatch[1]}
          </sub>
        );
        remaining = remaining.slice(subMatch[0].length);
        continue;
      }

      // Check for italic (*text* or _text_) - but not ** or __
      const italicMatch = remaining.match(/^(\*|_)(?!\1)(.+?)\1(?!\1)/);
      if (italicMatch) {
        elements.push(
          <em key={key++} className="italic">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for inline code (`code`)
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        elements.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Find the next special character
      const nextSpecial = remaining.search(/[*_`\^]/);
      if (nextSpecial === -1) {
        // No more special characters, add the rest as text
        elements.push(<span key={key++}>{remaining}</span>);
        break;
      } else if (nextSpecial === 0) {
        // Special character at start but didn't match pattern, treat as literal
        elements.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      } else {
        // Add text before the special character
        elements.push(<span key={key++}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      }
    }

    return elements;
  };

  // Clean and split by newlines to handle line breaks
  const lines = cleanLatex(text).split('\n');

  return (
    <div className={cn("text-sm text-foreground leading-relaxed", className)}>
      {lines.map((line, lineIndex) => (
        <p key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
          {parseMarkdown(line)}
        </p>
      ))}
    </div>
  );
}
