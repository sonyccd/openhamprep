import { useState, useMemo } from "react";
import { Search, BookText, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GlossaryProps {
  onStartFlashcards: () => void;
}

export function Glossary({ onStartFlashcards }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading glossary...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookText className="w-6 h-6 text-primary" />
            Glossary
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {terms.length} terms • Search or browse ham radio terminology
          </p>
        </div>
        <Button onClick={onStartFlashcards} className="gap-2">
          <Layers className="w-4 h-4" />
          Study Flashcards
        </Button>
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
                    <Card key={term.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="py-3 px-4">
                        <h3 className="font-semibold text-foreground">{term.term}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{term.definition}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
