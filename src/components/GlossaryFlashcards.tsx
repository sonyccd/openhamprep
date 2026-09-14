import { useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/ohp/PageContainer";
import { FlashcardComplete } from "@/components/flashcards/FlashcardComplete";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { FlashcardStart, type FlashcardMode } from "@/components/flashcards/FlashcardStart";

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
  }, [terms, mode]);

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
    handleNext();
  };

  const sessionProgress = orderedTerms.length > 0
    ? ((stats.known.size + stats.unknown.size) / orderedTerms.length) * 100
    : 0;

  const isComplete = hasStarted && currentIndex === orderedTerms.length - 1 &&
    (stats.known.has(currentTerm?.id || '') || stats.unknown.has(currentTerm?.id || ''));

  if (isLoading) {
    return (
      <PageContainer
        width="narrow"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <CircularProgress size={48} />
          <Typography sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            TUNING...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!hasStarted) {
    return (
      <PageContainer width="narrow" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <FlashcardStart
          termCount={terms.length}
          mode={mode}
          onModeChange={setMode}
          onStart={startStudy}
          onBack={onBack}
        />
      </PageContainer>
    );
  }

  if (isComplete) {
    return (
      <PageContainer width="narrow" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <FlashcardComplete
          knownCount={stats.known.size}
          unknownCount={stats.unknown.size}
          onBack={onBack}
          onRestart={() => setHasStarted(false)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <FlashcardDeck
        mode={mode}
        front={mode === "term-to-definition" ? currentTerm?.term : currentTerm?.definition}
        back={mode === "term-to-definition" ? currentTerm?.definition : currentTerm?.term}
        isFlipped={isFlipped}
        currentIndex={currentIndex}
        total={orderedTerms.length}
        knownCount={stats.known.size}
        unknownCount={stats.unknown.size}
        sessionProgress={sessionProgress}
        onFlip={() => setIsFlipped(!isFlipped)}
        onPrev={handlePrevious}
        onNext={handleNext}
        onMarkKnown={handleMarkKnown}
        onMarkUnknown={handleMarkUnknown}
        onBack={onBack}
      />
    </PageContainer>
  );
}
