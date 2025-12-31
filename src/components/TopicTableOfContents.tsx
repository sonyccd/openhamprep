import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TopicTableOfContentsProps {
  content: string;
  activeId?: string;
  onItemClick?: (id: string) => void;
}

export function TopicTableOfContents({
  content,
  activeId,
  onItemClick,
}: TopicTableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  // Parse headings from markdown content
  useEffect(() => {
    if (!content) {
      setTocItems([]);
      return;
    }

    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      // Create a URL-friendly ID
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      items.push({ id, text, level });
    }

    setTocItems(items);
  }, [content]);

  if (tocItems.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    onItemClick?.(id);
    // Scroll to the heading
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="sticky top-4">
      {/* Desktop view */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <List className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Contents</span>
        </div>
        <nav className="space-y-1">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                "hover:bg-secondary hover:text-foreground",
                item.level === 1 && "font-medium",
                item.level === 2 && "pl-4",
                item.level === 3 && "pl-6 text-xs",
                activeId === item.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile view - collapsible */}
      <div className="lg:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between mb-2"
              size="sm"
            >
              <span className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Table of Contents
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <nav className="space-y-1 p-2 bg-secondary/30 rounded-lg">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleClick(item.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left text-sm py-1.5 px-2 rounded transition-colors",
                    "hover:bg-secondary hover:text-foreground",
                    item.level === 1 && "font-medium",
                    item.level === 2 && "pl-4",
                    item.level === 3 && "pl-6 text-xs",
                    activeId === item.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  )}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
