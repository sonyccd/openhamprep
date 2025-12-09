import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { BookOpen, SkipForward, RotateCcw, Loader2, ChevronRight, CheckCircle, ArrowLeft, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TopicLanding } from "@/components/TopicLanding";

interface HistoryEntry {
  question: Question;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  showResult: boolean;
}

interface SubelementPracticeProps {
  onBack: () => void;
}

type TopicView = 'list' | 'landing' | 'practice';

const SUBELEMENT_NAMES: Record<string, string> = {
  T0: "Commission's Rules",
  T1: "Operating Procedures",
  T2: "Radio Wave Characteristics",
  T3: "Radio Wave Propagation",
  T4: "Amateur Radio Practices",
  T5: "Electrical Principles",
  T6: "Electronic Components",
  T7: "Station Equipment",
  T8: "Operating Activities",
  T9: "Antennas & Feed Lines"
};

export function SubelementPractice({
  onBack
}: SubelementPracticeProps) {
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions();
  const {
    saveRandomAttempt
  } = useProgress();
  const { capture } = usePostHog();
  
  const [selectedSubelement, setSelectedSubelement] = useState<string | null>(null);
  const [topicView, setTopicView] = useState<TopicView>('list');
  const [stats, setStats] = useState({
    correct: 0,
    total: 0
  });
  const [askedIds, setAskedIds] = useState<string[]>([]);
  
  // Session history for back navigation
  const [questionHistory, setQuestionHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Current question from history
  const currentEntry = historyIndex >= 0 ? questionHistory[historyIndex] : null;
  const question = currentEntry?.question || null;
  const selectedAnswer = currentEntry?.selectedAnswer || null;
  const showResult = currentEntry?.showResult || false;

  // Group questions by subelement
  const questionsBySubelement = useMemo(() => {
    if (!allQuestions) return {};
    return allQuestions.reduce((acc, q) => {
      if (!acc[q.subelement]) acc[q.subelement] = [];
      acc[q.subelement].push(q);
      return acc;
    }, {} as Record<string, Question[]>);
  }, [allQuestions]);

  const subelements = useMemo(() => {
    return Object.keys(questionsBySubelement).sort();
  }, [questionsBySubelement]);

  const currentQuestions = selectedSubelement ? questionsBySubelement[selectedSubelement] || [] : [];

  const getRandomQuestion = useCallback((excludeIds: string[] = []): Question | null => {
    if (currentQuestions.length === 0) return null;
    const available = currentQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      return currentQuestions[Math.floor(Math.random() * currentQuestions.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }, [currentQuestions]);

  // Update current entry in history
  const updateCurrentEntry = (updates: Partial<HistoryEntry>) => {
    setQuestionHistory(prev => {
      const newHistory = [...prev];
      if (historyIndex >= 0 && historyIndex < newHistory.length) {
        newHistory[historyIndex] = { ...newHistory[historyIndex], ...updates };
      }
      return newHistory;
    });
  };

  const handleSelectSubelement = (sub: string) => {
    setSelectedSubelement(sub);
    setTopicView('landing');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({
      correct: 0,
      total: 0
    });
    setAskedIds([]);
    
    capture(ANALYTICS_EVENTS.TOPIC_SELECTED, { 
      subelement: sub, 
      topic_name: SUBELEMENT_NAMES[sub] || sub 
    });
  };

  const handleStartPractice = () => {
    setTopicView('practice');
    const firstQuestion = getRandomQuestion();
    if (firstQuestion) {
      setQuestionHistory([{ question: firstQuestion, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
    }
    capture(ANALYTICS_EVENTS.SUBELEMENT_PRACTICE_STARTED, { 
      subelement: selectedSubelement,
      topic_name: SUBELEMENT_NAMES[selectedSubelement || ''] || selectedSubelement 
    });
  };

  const handleBackToLanding = () => {
    setTopicView('landing');
    setQuestionHistory([]);
    setHistoryIndex(-1);
  };

  const handleBackToList = () => {
    setSelectedSubelement(null);
    setTopicView('list');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({
      correct: 0,
      total: 0
    });
    setAskedIds([]);
  };

  if (isLoading) {
    return <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>;
  }

  if (error || !allQuestions || allQuestions.length === 0) {
    return <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>;
  }

  // Show subelement selection list
  if (topicView === 'list' || !selectedSubelement) {
    return <div className="flex-1 bg-background py-8 px-4 pb-24 md:pb-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-end mb-8">
            
          </div>

          <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="mb-6">
            <h1 className="text-2xl font-mono font-bold text-foreground mb-2">
              Choose a Topic
            </h1>
            <p className="text-muted-foreground">
              Focus on specific areas to strengthen your knowledge
            </p>
          </motion.div>

          <div className="grid gap-3">
            {subelements.map((sub, index) => {
            const count = questionsBySubelement[sub]?.length || 0;
            return <motion.button key={sub} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: index * 0.05
            }} onClick={() => handleSelectSubelement(sub)} className={cn("w-full p-4 rounded-xl border bg-card text-left", "hover:bg-secondary hover:border-foreground/20 hover:shadow-lg", "transition-all duration-200 group")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-mono font-bold text-foreground">
                        {sub}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {SUBELEMENT_NAMES[sub] || `Subelement ${sub}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {count} questions
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </motion.button>;
          })}
          </div>
        </div>
      </div>;
  }

  // Show topic landing page
  if (topicView === 'landing') {
    return <TopicLanding subelement={selectedSubelement} subelementName={SUBELEMENT_NAMES[selectedSubelement] || `Subelement ${selectedSubelement}`} questions={currentQuestions} onBack={handleBackToList} onStartPractice={handleStartPractice} />;
  }

  // Show practice view
  if (!question) {
    return <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) return;
    
    updateCurrentEntry({ selectedAnswer: answer, showResult: true });
    
    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    await saveRandomAttempt(question, answer);
  };

  const handleNextQuestion = () => {
    // If we're not at the end of history, just move forward
    if (historyIndex < questionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      return;
    }
    
    // Otherwise, get a new question
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    const nextQuestion = getRandomQuestion(newAskedIds);
    if (nextQuestion) {
      setQuestionHistory(prev => [...prev, { question: nextQuestion, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    const nextQuestion = getRandomQuestion(newAskedIds);
    if (nextQuestion) {
      setQuestionHistory(prev => [...prev, { question: nextQuestion, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleReset = () => {
    setAskedIds([]);
    const firstQuestion = getRandomQuestion();
    if (firstQuestion) {
      setQuestionHistory([{ question: firstQuestion, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
    }
    setStats({
      correct: 0,
      total: 0
    });
  };

  const canGoBack = historyIndex > 0;
  const isViewingHistory = historyIndex < questionHistory.length - 1;
  const percentage = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
  const progress = Math.round(askedIds.length / currentQuestions.length * 100);

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => !showResult && handleSelectAnswer('A'), disabled: showResult },
    { key: 'b', description: 'Select B', action: () => !showResult && handleSelectAnswer('B'), disabled: showResult },
    { key: 'c', description: 'Select C', action: () => !showResult && handleSelectAnswer('C'), disabled: showResult },
    { key: 'd', description: 'Select D', action: () => !showResult && handleSelectAnswer('D'), disabled: showResult },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !showResult },
    { key: 'ArrowLeft', description: 'Previous', action: handlePreviousQuestion, disabled: !canGoBack },
    { key: 's', description: 'Skip', action: handleSkip, disabled: showResult },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: topicView === 'practice' });

  return <div className="flex-1 bg-background py-8 px-4 pb-24 md:pb-8 overflow-y-auto">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBackToLanding} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Topic Overview
          </Button>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono font-bold">{selectedSubelement}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {SUBELEMENT_NAMES[selectedSubelement] || `Subelement ${selectedSubelement}`}
              </span>
            </div>
          </div>
        </div>

        {/* Progress & Stats Bar */}
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-success">{stats.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-destructive">{stats.total - stats.correct}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-primary">{percentage}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          
          {/* Topic progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div initial={{
              width: 0
            }} animate={{
              width: `${progress}%`
            }} className="h-full bg-primary rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {askedIds.length}/{currentQuestions.length}
            </span>
            {askedIds.length === currentQuestions.length && <CheckCircle className="w-4 h-4 text-success" />}
          </div>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} showResult={showResult} enableGlossaryHighlight />

      {/* Actions */}
      <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-4">
        {canGoBack && (
          <Button variant="outline" onClick={handlePreviousQuestion} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
        )}
        {!showResult ? (
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} variant="default" size="lg" className="gap-2">
            {isViewingHistory ? "Next" : "Next Question"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* History indicator */}
      {questionHistory.length > 1 && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center text-muted-foreground text-sm mt-4"
        >
          Question {historyIndex + 1} of {questionHistory.length}
        </motion.p>
      )}
    </div>;
}
