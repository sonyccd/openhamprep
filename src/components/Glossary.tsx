import { useState, useMemo, useEffect, useRef } from "react";
import { Search, BookText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/ui/page-container";
import { useAppNavigation } from "@/hooks/useAppNavigation";

export function Glossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedTermId, setHighlightedTermId] = useState<string | null>(null);
  const termRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { selectedGlossaryTermId, setSelectedGlossaryTermId } = useAppNavigation();

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['glossary-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    const query = searchQuery.toLowerCase();
    return terms.filter(term => 
      term.term.toLowerCase().includes(query) || 
      term.definition.toLowerCase().includes(query)
    );
  }, [terms, searchQuery]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof terms> = {};
    filteredTerms.forEach(term => {
      const firstChar = term.term[0].toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(term);
    });
    return groups;
  }, [filteredTerms]);

  const sortedKeys = Object.keys(groupedTerms).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  // Handle scroll-to-term when navigated from search
  useEffect(() => {
    if (selectedGlossaryTermId && !isLoading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const termElement = termRefs.current.get(selectedGlossaryTermId);
        if (termElement) {
          termElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedTermId(selectedGlossaryTermId);
          // Clear highlight after animation
          setTimeout(() => {
            setHighlightedTermId(null);
          }, 2000);
        }
        // Clear the navigation state
        setSelectedGlossaryTermId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedGlossaryTermId, isLoading, setSelectedGlossaryTermId]);

  if (isLoading) {
    return (
      <PageContainer width="wide" className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide" className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookText className="w-6 h-6 text-primary" />
          Glossary
        </h1>
        <p className="text-muted-foreground text-base mt-1">
          {terms.length} terms • Search or browse ham radio terminology
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search terms or definitions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Terms List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No terms found matching "{searchQuery}"
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {sortedKeys.map(letter => (
              <div key={letter}>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                  <span className="text-lg font-bold text-primary">{letter}</span>
                </div>
                <div className="space-y-2">
                  {groupedTerms[letter].map(term => (
                    <Card
                      key={term.id}
                      ref={(el) => {
                        if (el) {
                          termRefs.current.set(term.id, el);
                        } else {
                          termRefs.current.delete(term.id);
                        }
                      }}
                      className={`bg-card/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        highlightedTermId === term.id
                          ? 'ring-2 ring-primary ring-offset-2 bg-primary/5'
                          : ''
                      }`}
                      onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(term.term)}&kp=1`, '_blank', 'noopener,noreferrer')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.open(`https://duckduckgo.com/?q=${encodeURIComponent(term.term)}&kp=1`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Search "${term.term}" on DuckDuckGo`}
                    >
                      <CardContent className="py-3 px-4">
                        <h3 className="font-semibold text-foreground text-lg">{term.term}</h3>
                        <p className="text-base text-muted-foreground mt-1">{term.definition}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </PageContainer>
  );
}
