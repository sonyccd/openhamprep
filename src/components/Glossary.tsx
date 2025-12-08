import { useState, useMemo } from "react";
import { Search, BookText, Layers, Trophy, Zap, Circle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface GlossaryProps {
  onStartFlashcards: () => void;
}

interface GlossaryProgress {
  id: string;
  user_id: string;
  term_id: string;
  mastered: boolean;
  times_seen: number;
  times_correct: number;
  last_seen_at: string;
}

type StatusFilter = 'all' | 'mastered' | 'learning' | 'weak' | 'unseen';

export function Glossary({ onStartFlashcards }: GlossaryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: terms = [], isLoading: termsLoading } = useQuery({
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

  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['glossary-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('glossary_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as GlossaryProgress[];
    },
    enabled: !!user?.id
  });

  const progressMap = useMemo(() => {
    return new Map(progress.map(p => [p.term_id, p]));
  }, [progress]);

  const masteredCount = useMemo(() => {
    return progress.filter(p => p.mastered).length;
  }, [progress]);

  const weakCount = useMemo(() => {
    return progress.filter(p => {
      if (p.mastered) return false;
      if (p.times_seen < 2) return false;
      const accuracy = p.times_correct / p.times_seen;
      return accuracy < 0.6;
    }).length;
  }, [progress]);

  const seenCount = useMemo(() => {
    return progress.length;
  }, [progress]);

  const getTermStatus = (termId: string): StatusFilter => {
    const p = progressMap.get(termId);
    if (!p) return 'unseen';
    if (p.mastered) return 'mastered';
    if (p.times_seen >= 2) {
      const accuracy = p.times_correct / p.times_seen;
      if (accuracy < 0.6) return 'weak';
    }
    return 'learning';
  };

  const filteredTerms = useMemo(() => {
    let result = terms;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(term => 
        term.term.toLowerCase().includes(query) || 
        term.definition.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(term => getTermStatus(term.id) === statusFilter);
    }
    
    return result;
  }, [terms, searchQuery, statusFilter, progressMap]);

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


  const isLoading = termsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading glossary...</div>
      </div>
    );
  }

  const masteryPercentage = terms.length > 0 ? Math.round((masteredCount / terms.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
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

      {/* Progress Summary */}
      {user && (
        <Card className="mb-4 bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Your Progress</span>
              </div>
              <span className="text-sm text-muted-foreground">{masteryPercentage}% mastered</span>
            </div>
            <Progress value={masteryPercentage} className="h-2 mb-2" />
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{masteredCount} mastered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">{weakCount} need work</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground">{terms.length - seenCount} unseen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search terms or definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {user && (
          <ToggleGroup 
            type="single" 
            value={statusFilter} 
            onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}
            className="justify-start"
          >
            <ToggleGroupItem value="all" aria-label="Show all" className="text-xs px-3">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="mastered" aria-label="Show mastered" className="text-xs px-3 data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
              <Trophy className="w-3 h-3 mr-1" />
              Mastered
            </ToggleGroupItem>
            <ToggleGroupItem value="weak" aria-label="Show weak" className="text-xs px-3 data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-500">
              <Zap className="w-3 h-3 mr-1" />
              Weak
            </ToggleGroupItem>
            <ToggleGroupItem value="unseen" aria-label="Show unseen" className="text-xs px-3">
              <Circle className="w-3 h-3 mr-1" />
              New
            </ToggleGroupItem>
          </ToggleGroup>
        )}
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
                  {groupedTerms[letter].map(term => {
                    const status = getTermStatus(term.id);
                    return (
                      <Card 
                        key={term.id} 
                        className={cn(
                          "bg-card/50 border-border/50 hover:border-primary/30 transition-colors",
                          status === 'mastered' && "border-l-2 border-l-primary",
                          status === 'weak' && "border-l-2 border-l-orange-500",
                          status === 'learning' && "border-l-2 border-l-blue-500"
                        )}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground">{term.term}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{term.definition}</p>
                            </div>
                            {user && (
                              <div className="flex-shrink-0">
                                {status === 'mastered' && (
                                  <Badge variant="default" className="bg-primary gap-1 text-xs">
                                    <Trophy className="w-3 h-3" />
                                    Mastered
                                  </Badge>
                                )}
                                {status === 'weak' && (
                                  <Badge variant="outline" className="border-orange-500/50 text-orange-500 gap-1 text-xs">
                                    <Zap className="w-3 h-3" />
                                    Needs Work
                                  </Badge>
                                )}
                                {status === 'learning' && (
                                  <Badge variant="outline" className="border-blue-500/50 text-blue-500 text-xs">
                                    Learning
                                  </Badge>
                                )}
                                {status === 'unseen' && (
                                  <Badge variant="outline" className="text-muted-foreground text-xs gap-1">
                                    <Circle className="w-2 h-2" />
                                    New
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
