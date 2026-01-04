import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, RotateCcw, Shuffle, ChevronLeft, ChevronRight, Zap, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { PageContainer } from "@/components/ui/page-container";

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

  // Loading state
  if (isLoading) {
    return (
      <PageContainer width="narrow" className="flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <Radio className="w-12 h-12 text-primary" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <span className="text-base text-muted-foreground font-mono">TUNING...</span>
        </motion.div>
      </PageContainer>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <PageContainer width="narrow" className="flex flex-col h-full">
        <Button variant="ghost" onClick={onBack} className="self-start mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Title with radio aesthetic */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-3 mb-3">
              <Waves className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Terms</h1>
              <Waves className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground font-mono text-base">
              {terms.length} TERMS LOADED
            </p>
          </motion.div>

          {/* Mode Selection - styled like radio frequency selector */}
          <motion.div
            className="w-full max-w-sm mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="text-sm font-mono text-muted-foreground mb-3 text-center uppercase tracking-wider">
              Select Mode
            </div>
            <div className="relative bg-secondary/50 rounded-xl p-1.5 border border-border">
              <motion.div
                className="absolute top-1.5 bottom-1.5 bg-primary rounded-lg shadow-lg"
                initial={false}
                animate={{
                  left: mode === 'term-to-definition' ? '6px' : '50%',
                  right: mode === 'term-to-definition' ? '50%' : '6px',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="relative grid grid-cols-2 gap-1">
                <button
                  onClick={() => setMode('term-to-definition')}
                  className={cn(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-colors relative z-10",
                    mode === 'term-to-definition'
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Term → Definition
                </button>
                <button
                  onClick={() => setMode('definition-to-term')}
                  className={cn(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-colors relative z-10",
                    mode === 'definition-to-term'
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Definition → Term
                </button>
              </div>
            </div>
          </motion.div>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              size="lg"
              onClick={startStudy}
              className="gap-3 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Shuffle className="w-5 h-5" />
              Start Studying
            </Button>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  // Completion screen
  if (isComplete) {
    const knownCount = stats.known.size;
    const unknownCount = stats.unknown.size;
    const total = knownCount + unknownCount;
    const percentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <PageContainer width="narrow" className="flex flex-col h-full">
        <Button variant="ghost" onClick={onBack} className="self-start mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border-2 border-success/30">
                <Zap className="w-10 h-10 text-success" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-success/50"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">Session Complete</h1>
            <p className="text-muted-foreground font-mono text-base mb-8">
              {total} CARDS REVIEWED
            </p>
          </motion.div>

          {/* Stats display - VU meter style */}
          <motion.div
            className="w-full max-w-xs mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              {/* Score */}
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-foreground font-mono">{percentage}%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Mastery</div>
              </div>

              {/* Known bar */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-success font-medium">Known</span>
                  <span className="font-mono text-muted-foreground">{knownCount}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-success to-success/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (knownCount / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  />
                </div>
              </div>

              {/* Need review bar */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-destructive font-medium">Need Review</span>
                  <span className="font-mono text-muted-foreground">{unknownCount}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-destructive to-destructive/80 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (unknownCount / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => setHasStarted(false)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              New Session
            </Button>
          </motion.div>
        </div>
      </PageContainer>
    );
  }

  // Flashcard view
  const frontContent = mode === 'term-to-definition' ? currentTerm?.term : currentTerm?.definition;
  const backContent = mode === 'term-to-definition' ? currentTerm?.definition : currentTerm?.term;
  const isTerm = (mode === 'term-to-definition' && !isFlipped) || (mode === 'definition-to-term' && isFlipped);

  return (
    <PageContainer width="narrow" className="flex flex-col h-full">
      {/* Minimal header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-success font-mono">{stats.known.size}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-destructive font-mono">{stats.unknown.size}</span>
          </div>
          <div className="font-mono text-base text-muted-foreground">
            {currentIndex + 1}<span className="opacity-50">/{orderedTerms.length}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${sessionProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
        {/* Fixed width card wrapper - 448px (28rem) on desktop, full width minus padding on mobile */}
        <div
          className="w-full sm:w-[448px] px-4 sm:px-0 cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Fixed dimensions card container */}
          <div className={cn(
            "relative rounded-2xl p-6 sm:p-8 h-[300px] sm:h-[320px] w-full flex flex-col transition-colors duration-300",
            "bg-card border-2 shadow-lg",
            isFlipped
              ? "border-primary/40 shadow-primary/5"
              : "border-border hover:border-primary/30",
            "group-hover:shadow-xl"
          )}>
            {/* Card type indicator */}
            <div className="flex items-center justify-center mb-4 h-7">
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-mono uppercase tracking-wider transition-colors",
                isFlipped
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}>
                {isFlipped
                  ? (mode === 'term-to-definition' ? 'Definition' : 'Term')
                  : (mode === 'term-to-definition' ? 'Term' : 'Definition')
                }
              </div>
            </div>

            {/* Content area - fixed size container, text adapts */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentIndex}-${isFlipped}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full flex items-center justify-center overflow-y-auto px-2"
                >
                  <p className={cn(
                    "text-center leading-relaxed",
                    isTerm
                      ? "text-xl sm:text-2xl font-bold text-foreground"
                      : "text-base sm:text-lg text-foreground/90"
                  )}>
                    {isFlipped ? backContent : frontContent}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Tap hint */}
            <div className="flex items-center justify-center mt-4 h-5">
              <span className="text-sm text-muted-foreground/70">
                {isFlipped ? 'tap to hide' : 'tap to reveal'}
              </span>
            </div>

            {/* Corner accent */}
            <div className={cn(
              "absolute top-4 right-4 w-2 h-2 rounded-full transition-colors",
              isFlipped ? "bg-primary" : "bg-muted-foreground/20"
            )} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-8 w-full max-w-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            onClick={handleMarkUnknown}
            className="flex-1 max-w-[140px] gap-2 py-5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <span className="text-lg">✗</span>
            <span>Review</span>
          </Button>

          <Button
            onClick={handleMarkKnown}
            className="flex-1 max-w-[140px] gap-2 py-5 rounded-xl bg-success hover:bg-success/90 text-success-foreground"
          >
            <span className="text-lg">✓</span>
            <span>Got It</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === orderedTerms.length - 1}
            className="rounded-full w-10 h-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
