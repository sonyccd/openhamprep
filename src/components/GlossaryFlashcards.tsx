import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, RotateCcw, Shuffle, ChevronLeft, ChevronRight, Eye, EyeOff, CheckCircle2, XCircle, Trophy, Brain, Zap, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type FlashcardMode = 'term-to-definition' | 'definition-to-term';
type StudyMode = 'all' | 'smart' | 'weak';

interface GlossaryFlashcardsProps {
  onBack: () => void;
}

interface CardStats {
  known: Set<string>;
  unknown: Set<string>;
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

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
}

// Calculate priority score for spaced repetition (lower = higher priority)
function calculatePriority(progress: GlossaryProgress | undefined, now: Date): number {
  if (!progress) {
    // Never seen - highest priority
    return 0;
  }

  const lastSeen = new Date(progress.last_seen_at);
  const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
  
  // Calculate accuracy (0-1)
  const accuracy = progress.times_seen > 0 
    ? progress.times_correct / progress.times_seen 
    : 0;

  // If mastered, deprioritize significantly
  if (progress.mastered) {
    return 1000 + hoursSinceLastSeen; // Still bring back after long time
  }

  // Priority factors:
  // - Lower accuracy = higher priority (multiply by inverse)
  // - More time since last seen = higher priority
  // - Fewer times seen = higher priority
  const accuracyFactor = 1 - accuracy; // 0 (perfect) to 1 (always wrong)
  const timeFactor = Math.min(hoursSinceLastSeen / 24, 30); // Cap at 30 days
  const exposureFactor = Math.max(0, 10 - progress.times_seen) / 10; // Less exposure = higher priority

  // Combine factors (lower score = higher priority)
  return 100 - (accuracyFactor * 40 + timeFactor * 30 + exposureFactor * 30);
}

export function GlossaryFlashcards({ onBack }: GlossaryFlashcardsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<FlashcardMode>('term-to-definition');
  const [studyMode, setStudyMode] = useState<StudyMode>('smart');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [orderedTerms, setOrderedTerms] = useState<GlossaryTerm[]>([]);
  const [stats, setStats] = useState<CardStats>({ known: new Set(), unknown: new Set() });
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const sessionStartTime = useRef<Date | null>(null);

  const { data: terms = [], isLoading: termsLoading } = useQuery({
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

  const masteredTermIds = useMemo(() => {
    return new Set(progress.filter(p => p.mastered).map(p => p.term_id));
  }, [progress]);

  const progressMap = useMemo(() => {
    return new Map(progress.map(p => [p.term_id, p]));
  }, [progress]);

  // Calculate weak terms (low accuracy, not mastered)
  const weakTermIds = useMemo(() => {
    const weak = new Set<string>();
    progress.forEach(p => {
      if (!p.mastered && p.times_seen >= 2) {
        const accuracy = p.times_correct / p.times_seen;
        if (accuracy < 0.6) {
          weak.add(p.term_id);
        }
      }
    });
    return weak;
  }, [progress]);

  // Terms that haven't been seen yet
  const unseenTermIds = useMemo(() => {
    const seenIds = new Set(progress.map(p => p.term_id));
    return new Set(terms.filter(t => !seenIds.has(t.id)).map(t => t.id));
  }, [terms, progress]);

  const upsertProgress = useMutation({
    mutationFn: async ({ termId, isCorrect }: { termId: string; isCorrect: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const existing = progressMap.get(termId);
      const newTimesSeen = (existing?.times_seen || 0) + 1;
      const newTimesCorrect = (existing?.times_correct || 0) + (isCorrect ? 1 : 0);
      const newMastered = newTimesCorrect >= 3 && (newTimesCorrect / newTimesSeen) >= 0.75;

      const { error } = await supabase
        .from('glossary_progress')
        .upsert({
          user_id: user.id,
          term_id: termId,
          times_seen: newTimesSeen,
          times_correct: newTimesCorrect,
          mastered: newMastered,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,term_id'
        });

      if (error) throw error;
      return { termId, mastered: newMastered };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['glossary-progress', user?.id] });
      if (data.mastered) {
        toast.success('Term mastered!', { icon: '🎯' });
      }
    }
  });

  // Save study session and update streak
  const saveStudySession = useMutation({
    mutationFn: async ({ termsStudied, termsCorrect }: { termsStudied: number; termsCorrect: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const today = new Date().toISOString().split('T')[0];
      const sessionDuration = sessionStartTime.current 
        ? Math.round((new Date().getTime() - sessionStartTime.current.getTime()) / 1000)
        : 0;

      // Upsert study session for today
      const { error: sessionError } = await supabase
        .from('glossary_study_sessions')
        .upsert({
          user_id: user.id,
          study_date: today,
          terms_studied: termsStudied,
          terms_correct: termsCorrect,
          session_duration_seconds: sessionDuration
        }, {
          onConflict: 'user_id,study_date'
        });

      if (sessionError) throw sessionError;

      // Get current profile to calculate streak
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('glossary_current_streak, glossary_best_streak, glossary_last_study_date')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const lastStudyDate = profile?.glossary_last_study_date;
      const currentStreak = profile?.glossary_current_streak || 0;
      const bestStreak = profile?.glossary_best_streak || 0;

      let newStreak = 1;
      
      if (lastStudyDate) {
        const lastDate = new Date(lastStudyDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Already studied today, keep current streak
          newStreak = currentStreak;
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak = currentStreak + 1;
        }
        // If diffDays > 1, streak resets to 1 (already set)
      }

      const newBestStreak = Math.max(bestStreak, newStreak);

      // Update profile with new streak
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          glossary_current_streak: newStreak,
          glossary_best_streak: newBestStreak,
          glossary_last_study_date: today
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return { newStreak, newBestStreak, isNewBest: newStreak > bestStreak };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile-glossary-streak', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['glossary-study-sessions', user?.id] });
      
      if (data.isNewBest && data.newStreak > 1) {
        toast.success(`New best streak: ${data.newStreak} days! 🔥`);
      } else if (data.newStreak > 1) {
        toast.success(`${data.newStreak} day streak! Keep it up! 🔥`);
      }
    }
  });

  const startStudy = useCallback(() => {
    const now = new Date();
    let termsToStudy: GlossaryTerm[] = [];

    if (studyMode === 'all') {
      // Random shuffle all terms
      termsToStudy = [...terms];
      for (let i = termsToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [termsToStudy[i], termsToStudy[j]] = [termsToStudy[j], termsToStudy[i]];
      }
    } else if (studyMode === 'weak') {
      // Only weak + unseen terms
      termsToStudy = terms.filter(t => weakTermIds.has(t.id) || unseenTermIds.has(t.id));
      // Sort by priority
      termsToStudy.sort((a, b) => {
        const priorityA = calculatePriority(progressMap.get(a.id), now);
        const priorityB = calculatePriority(progressMap.get(b.id), now);
        return priorityA - priorityB;
      });
    } else {
      // Smart mode: prioritize by spaced repetition algorithm
      termsToStudy = [...terms].sort((a, b) => {
        const priorityA = calculatePriority(progressMap.get(a.id), now);
        const priorityB = calculatePriority(progressMap.get(b.id), now);
        return priorityA - priorityB;
      });
    }

    if (termsToStudy.length === 0) {
      toast.info('No terms match this filter. Try "All Terms" mode.');
      return;
    }

    setOrderedTerms(termsToStudy);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: new Set(), unknown: new Set() });
    setSessionSaved(false);
    sessionStartTime.current = new Date();
    setHasStarted(true);
  }, [terms, studyMode, progressMap, weakTermIds, unseenTermIds]);

  const currentTerm = useMemo(() => {
    if (!hasStarted || orderedTerms.length === 0) return null;
    return orderedTerms[currentIndex];
  }, [orderedTerms, currentIndex, hasStarted]);

  // Save session when complete
  useEffect(() => {
    if (hasStarted && !sessionSaved && user?.id) {
      const total = stats.known.size + stats.unknown.size;
      const isComplete = currentIndex === orderedTerms.length - 1 && 
        (stats.known.has(currentTerm?.id || '') || stats.unknown.has(currentTerm?.id || ''));
      
      if (isComplete && total > 0) {
        setSessionSaved(true);
        saveStudySession.mutate({
          termsStudied: total,
          termsCorrect: stats.known.size
        });
      }
    }
  }, [stats, currentIndex, orderedTerms.length, currentTerm?.id, hasStarted, sessionSaved, user?.id]);

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
    
    if (user?.id) {
      upsertProgress.mutate({ termId: currentTerm.id, isCorrect: true });
    }
    
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
    
    if (user?.id) {
      upsertProgress.mutate({ termId: currentTerm.id, isCorrect: false });
    }
    
    handleNext();
  };

  const sessionProgress = orderedTerms.length > 0 
    ? ((stats.known.size + stats.unknown.size) / orderedTerms.length) * 100 
    : 0;

  const isComplete = hasStarted && currentIndex === orderedTerms.length - 1 && (stats.known.has(currentTerm?.id || '') || stats.unknown.has(currentTerm?.id || ''));

  const isLoading = termsLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading flashcards...</div>
      </div>
    );
  }

  // Mode selection / Start screen
  if (!hasStarted) {
    const totalMastered = masteredTermIds.size;
    const masteryPercentage = terms.length > 0 ? Math.round((totalMastered / terms.length) * 100) : 0;
    const weakCount = weakTermIds.size + unseenTermIds.size;

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="self-start mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Glossary
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Glossary Flashcards</h1>
          <p className="text-muted-foreground mb-4 text-center">
            {terms.length} terms available
          </p>

          {/* Mastery Progress */}
          {user && (
            <Card className="w-full max-w-md mb-6 bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Your Progress</span>
                  </div>
                  <Badge variant="secondary">{totalMastered} / {terms.length} mastered</Badge>
                </div>
                <Progress value={masteryPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{unseenTermIds.size} unseen</span>
                  <span>{weakTermIds.size} need practice</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Study Mode Selection */}
          <div className="w-full max-w-md mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Study Mode</h3>
            <div className="grid gap-3">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  studyMode === 'smart' && "border-primary bg-primary/5"
                )}
                onClick={() => setStudyMode('smart')}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-sm">Smart Review</h3>
                        <p className="text-xs text-muted-foreground">Prioritizes weak & unseen terms using spaced repetition</p>
                      </div>
                    </div>
                    {studyMode === 'smart' && <Badge variant="default">Selected</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  studyMode === 'weak' && "border-primary bg-primary/5"
                )}
                onClick={() => setStudyMode('weak')}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <div>
                        <h3 className="font-semibold text-sm">Focus Mode</h3>
                        <p className="text-xs text-muted-foreground">Only weak & unseen terms ({weakCount} terms)</p>
                      </div>
                    </div>
                    {studyMode === 'weak' && <Badge variant="default">Selected</Badge>}
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  studyMode === 'all' && "border-primary bg-primary/5"
                )}
                onClick={() => setStudyMode('all')}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shuffle className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-sm">All Terms</h3>
                        <p className="text-xs text-muted-foreground">Random shuffle of all {terms.length} terms</p>
                      </div>
                    </div>
                    {studyMode === 'all' && <Badge variant="default">Selected</Badge>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
            <Brain className="w-4 h-4" />
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
    const totalMastered = masteredTermIds.size;

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto">
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

          <p className="text-lg font-semibold text-foreground mb-2">
            Session Score: {percentage}%
          </p>

          {user && (
            <Card className="w-full max-w-xs mb-6 bg-primary/5 border-primary/20">
              <CardContent className="py-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Total Mastered</span>
                </div>
                <div className="text-2xl font-bold text-primary">{totalMastered} / {terms.length}</div>
              </CardContent>
            </Card>
          )}

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
  const isMastered = currentTerm ? masteredTermIds.has(currentTerm.id) : false;
  const isWeak = currentTerm ? weakTermIds.has(currentTerm.id) : false;
  const isUnseen = currentTerm ? unseenTermIds.has(currentTerm.id) : false;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {isMastered && (
            <Badge variant="default" className="bg-primary gap-1">
              <Trophy className="w-3 h-3" />
              Mastered
            </Badge>
          )}
          {isWeak && !isMastered && (
            <Badge variant="outline" className="border-orange-500/50 text-orange-500 gap-1">
              <Zap className="w-3 h-3" />
              Needs Work
            </Badge>
          )}
          {isUnseen && (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500">
              New
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            {currentIndex + 1} / {orderedTerms.length}
          </Badge>
        </div>
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
              <Card className={cn(
                "w-full h-full flex flex-col items-center justify-center p-6 border-2 hover:border-primary/30 transition-colors",
                isMastered && "bg-primary/5 border-primary/20",
                isWeak && !isMastered && "bg-orange-500/5 border-orange-500/20"
              )}>
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
