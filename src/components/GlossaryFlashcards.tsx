import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, RotateCcw, Shuffle, ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";

type FlashcardMode = 'term-to-definition' | 'definition-to-term';

interface GlossaryFlashcardsProps {
  onBack: () => void;
}

interface CardStats {
  known: Set<string>;
  unknown: Set<string>;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
}

export function GlossaryFlashcards({ onBack }: GlossaryFlashcardsProps) {
  const [mode, setMode] = useState<FlashcardMode>('term-to-definition');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [orderedTerms, setOrderedTerms] = useState<GlossaryTerm[]>([]);
  const [stats, setStats] = useState<CardStats>({ known: new Set(), unknown: new Set() });
  const [hasStarted, setHasStarted] = useState(false);
  const { capture } = usePostHog();

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['glossary-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data as GlossaryTerm[];
    }
  });

  const startStudy = useCallback(() => {
    // Random shuffle all terms
    const termsToStudy = [...terms];
    for (let i = termsToStudy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [termsToStudy[i], termsToStudy[j]] = [termsToStudy[j], termsToStudy[i]];
    }

    setOrderedTerms(termsToStudy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: new Set(), unknown: new Set() });
    setHasStarted(true);
    
    capture(ANALYTICS_EVENTS.FLASHCARD_SESSION_STARTED, { 
      term_count: termsToStudy.length,
      mode 
    });
  }, [terms, capture, mode]);

  const currentTerm = useMemo(() => {
    if (!hasStarted || orderedTerms.length === 0) return null;
    return orderedTerms[currentIndex];
  }, [orderedTerms, currentIndex, hasStarted]);

  const handleNext = () => {
    if (currentIndex < orderedTerms.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleMarkKnown = () => {
    if (!currentTerm) return;
    setStats(prev => {
      const newKnown = new Set(prev.known);
      const newUnknown = new Set(prev.unknown);
      newKnown.add(currentTerm.id);
      newUnknown.delete(currentTerm.id);
      return { known: newKnown, unknown: newUnknown };
    });
    capture(ANALYTICS_EVENTS.TERM_MARKED_KNOWN, { term: currentTerm.term });
    handleNext();
  };

  const handleMarkUnknown = () => {
    if (!currentTerm) return;
    setStats(prev => {
      const newKnown = new Set(prev.known);
      const newUnknown = new Set(prev.unknown);
      newUnknown.add(currentTerm.id);
      newKnown.delete(currentTerm.id);
      return { known: newKnown, unknown: newUnknown };
    });
    capture(ANALYTICS_EVENTS.TERM_MARKED_UNKNOWN, { term: currentTerm.term });
    handleNext();
  };

  const sessionProgress = orderedTerms.length > 0 
    ? ((stats.known.size + stats.unknown.size) / orderedTerms.length) * 100 
    : 0;

  const isComplete = hasStarted && currentIndex === orderedTerms.length - 1 && 
    (stats.known.has(currentTerm?.id || '') || stats.unknown.has(currentTerm?.id || ''));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8">
        <Button variant="ghost" onClick={onBack} className="self-start mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Glossary
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Glossary Flashcards</h1>
          <p className="text-muted-foreground mb-8 text-center">
            {terms.length} terms available
          </p>

          {/* Card Mode Selection */}
          <div className="w-full max-w-md mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Card Direction</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  mode === 'term-to-definition' && "border-primary bg-primary/5"
                )}
                onClick={() => setMode('term-to-definition')}
              >
                <CardContent className="py-3 px-4 text-center">
                  <h3 className="font-semibold text-sm">Term → Definition</h3>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  mode === 'definition-to-term' && "border-primary bg-primary/5"
                )}
                onClick={() => setMode('definition-to-term')}
              >
                <CardContent className="py-3 px-4 text-center">
                  <h3 className="font-semibold text-sm">Definition → Term</h3>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button size="lg" onClick={startStudy} className="gap-2">
            <Shuffle className="w-4 h-4" />
            Start Studying
          </Button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    const knownCount = stats.known.size;
    const unknownCount = stats.unknown.size;
    const total = knownCount + unknownCount;
    const percentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8">
        <Button variant="ghost" onClick={onBack} className="self-start mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Glossary
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h1>
          <p className="text-muted-foreground mb-8">
            You reviewed {total} cards
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-4 text-center">
                <div className="text-3xl font-bold text-green-500">{knownCount}</div>
                <div className="text-sm text-muted-foreground">Known</div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-4 text-center">
                <div className="text-3xl font-bold text-red-500">{unknownCount}</div>
                <div className="text-sm text-muted-foreground">Need Review</div>
              </CardContent>
            </Card>
          </div>

          <p className="text-lg font-semibold text-foreground mb-6">
            Session Score: {percentage}%
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Glossary
            </Button>
            <Button onClick={() => setHasStarted(false)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Flashcard view
  const frontContent = mode === 'term-to-definition' ? currentTerm?.term : currentTerm?.definition;
  const backContent = mode === 'term-to-definition' ? currentTerm?.definition : currentTerm?.term;
  const frontLabel = mode === 'term-to-definition' ? 'Term' : 'Definition';
  const backLabel = mode === 'term-to-definition' ? 'Definition' : 'Term';

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Badge variant="outline" className="font-mono">
          {currentIndex + 1} / {orderedTerms.length}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="text-green-500">{stats.known.size} known</span>
          <span className="text-red-500">{stats.unknown.size} need review</span>
        </div>
        <Progress value={sessionProgress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          className="w-full aspect-[3/2] max-h-[400px] cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? 'back' : 'front'}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <Card className="w-full h-full flex flex-col items-center justify-center p-6 border-2 hover:border-primary/30 transition-colors">
                <Badge variant="secondary" className="mb-4">
                  {isFlipped ? backLabel : frontLabel}
                </Badge>
                <CardContent className="flex-1 flex items-center justify-center p-0">
                  <p className={cn(
                    "text-center",
                    (isFlipped ? backContent : frontContent)?.length! > 100 
                      ? "text-lg" 
                      : "text-2xl font-semibold"
                  )}>
                    {isFlipped ? backContent : frontContent}
                  </p>
                </CardContent>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                  {isFlipped ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>Click to {isFlipped ? 'hide' : 'reveal'} answer</span>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center justify-center gap-3 mt-6 w-full">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button 
            variant="outline"
            onClick={handleMarkUnknown}
            className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10 border-red-500/30"
          >
            <XCircle className="w-4 h-4" />
            Need Review
          </Button>

          <Button 
            variant="outline"
            onClick={handleMarkKnown}
            className="gap-2 text-green-500 hover:text-green-500 hover:bg-green-500/10 border-green-500/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Got It
          </Button>

          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === orderedTerms.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
