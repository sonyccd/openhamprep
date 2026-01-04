import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { usePostHog, ANALYTICS_EVENTS } from "@/hooks/usePostHog";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { QuestionListView } from "@/components/QuestionListView";
import { SkipForward, RotateCcw, Loader2, ChevronRight, CheckCircle, ArrowLeft, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TestType } from "@/types/navigation";
import { PageContainer } from "@/components/ui/page-container";

interface HistoryEntry {
  question: Question;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  showResult: boolean;
}

interface SubelementPracticeProps {
  onBack: () => void;
  testType: TestType;
}

type TopicView = 'list' | 'questions' | 'practice';

const SUBELEMENT_NAMES: Record<string, Record<string, string>> = {
  technician: {
    T0: "Safety",
    T1: "Commission's Rules",
    T2: "Operating Procedures",
    T3: "Radio Wave Characteristics",
    T4: "Amateur Radio Practices",
    T5: "Electrical Principles",
    T6: "Electronic Components",
    T7: "Station Equipment",
    T8: "Operating Activities",
    T9: "Antennas & Feed Lines"
  },
  general: {
    G0: "Safety",
    G1: "Commission's Rules",
    G2: "Operating Procedures",
    G3: "Radio Wave Propagation",
    G4: "Amateur Radio Practices",
    G5: "Electrical Principles",
    G6: "Circuit Components",
    G7: "Practical Circuits",
    G8: "Signals and Emissions",
    G9: "Antennas & Feed Lines"
  },
  extra: {
    E0: "Safety",
    E1: "Commission's Rules",
    E2: "Operating Procedures",
    E3: "Radio Wave Propagation",
    E4: "Amateur Practices",
    E5: "Electrical Principles",
    E6: "Circuit Components",
    E7: "Practical Circuits",
    E8: "Signals and Emissions",
    E9: "Antennas & Transmission Lines"
  }
};

// Topic descriptions for each subelement
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  T0: "Understanding FCC rules and regulations is fundamental to becoming a licensed amateur radio operator. This section covers the Commission's rules regarding station identification, authorized frequencies, power limits, and proper operating procedures.",
  T1: "Operating procedures form the backbone of effective amateur radio communication. This topic covers standard practices for making contacts, handling emergency communications, and participating in nets.",
  T2: "Radio waves are the foundation of all wireless communication. This section explores how radio signals behave, including concepts like frequency, wavelength, and the electromagnetic spectrum.",
  T3: "Propagation determines how far and how reliably your signal travels. This topic covers the various ways radio waves travel from transmitter to receiver.",
  T4: "Good amateur radio practices ensure safe, effective, and courteous operation. This section covers topics like RF safety, grounding, interference prevention, and station setup.",
  T5: "Electrical principles are essential for understanding how radio equipment works. This topic covers fundamental concepts like Ohm's Law, power calculations, and basic circuit theory.",
  T6: "Electronic components are the building blocks of all radio equipment. This section introduces resistors, capacitors, inductors, diodes, transistors, and integrated circuits.",
  T7: "Station equipment knowledge helps you select, operate, and maintain your radio gear. This topic covers transceivers, antennas, feed lines, and accessories.",
  T8: "Operating activities showcase the diverse world of amateur radio. This section covers various modes and activities including voice, digital modes, satellite communication, and emergency operations.",
  T9: "Antennas and feed lines are critical to your station's performance. This topic covers antenna types, feed line characteristics, and matching systems.",
};

export function SubelementPractice({
  onBack,
  testType
}: SubelementPracticeProps) {
  const { navigateToTopic } = useAppNavigation();
  const {
    data: allQuestions,
    isLoading,
    error
  } = useQuestions(testType);
  const {
    saveRandomAttempt
  } = useProgress();
  const { capture } = usePostHog();

  // Get subelement names for the current test type
  const subelementNames = SUBELEMENT_NAMES[testType] || {};
  const getSubelementName = (sub: string) => subelementNames[sub] || `Subelement ${sub}`;

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

  // Reset state when test type changes
  useEffect(() => {
    setSelectedSubelement(null);
    setTopicView('list');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({ correct: 0, total: 0 });
    setAskedIds([]);
  }, [testType]);

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

  const currentQuestions = useMemo(() => {
    return selectedSubelement ? questionsBySubelement[selectedSubelement] || [] : [];
  }, [selectedSubelement, questionsBySubelement]);

  const getRandomQuestion = useCallback((excludeIds: string[] = []): { question: Question; shouldResetAskedIds: boolean } | null => {
    if (currentQuestions.length === 0) return null;
    const available = currentQuestions.filter(q => !excludeIds.includes(q.id));
    if (available.length === 0) {
      // All questions have been asked, wrap around
      return {
        question: currentQuestions[Math.floor(Math.random() * currentQuestions.length)],
        shouldResetAskedIds: true
      };
    }
    return {
      question: available[Math.floor(Math.random() * available.length)],
      shouldResetAskedIds: false
    };
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
    setTopicView('questions');
    setQuestionHistory([]);
    setHistoryIndex(-1);
    setStats({
      correct: 0,
      total: 0
    });
    setAskedIds([]);

    capture(ANALYTICS_EVENTS.TOPIC_SELECTED, {
      subelement: sub,
      topic_name: getSubelementName(sub)
    });
  };

  const handleStartPractice = (startIndex?: number) => {
    setTopicView('practice');

    if (startIndex !== undefined && currentQuestions[startIndex]) {
      // Start from a specific question
      setQuestionHistory([{ question: currentQuestions[startIndex], selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
      setAskedIds([currentQuestions[startIndex].id]);
    } else {
      // Random start
      const result = getRandomQuestion();
      if (result) {
        setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(0);
        setAskedIds([result.question.id]);
      }
    }

    capture(ANALYTICS_EVENTS.SUBELEMENT_PRACTICE_STARTED, {
      subelement: selectedSubelement,
      topic_name: getSubelementName(selectedSubelement || '')
    });
  };

  const handleBackToQuestions = () => {
    setTopicView('questions');
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

  // Current question from history
  const canGoBack = historyIndex > 0;

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult || !question) return;

    updateCurrentEntry({ selectedAnswer: answer, showResult: true });

    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    await saveRandomAttempt(question, answer);
  };

  const handleNextQuestion = () => {
    if (!question) return;
    // If we're not at the end of history, just move forward
    if (historyIndex < questionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      return;
    }

    // Otherwise, get a new question
    const newAskedIds = [...askedIds, question.id];
    const result = getRandomQuestion(newAskedIds);
    if (result) {
      // If we've gone through all questions, reset the asked IDs to start fresh
      if (result.shouldResetAskedIds) {
        setAskedIds([result.question.id]);
        setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, { question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  };

  const handleSkip = () => {
    if (!question) return;
    const newAskedIds = [...askedIds, question.id];
    const result = getRandomQuestion(newAskedIds);
    if (result) {
      // If we've gone through all questions, reset the asked IDs to start fresh
      if (result.shouldResetAskedIds) {
        setAskedIds([result.question.id]);
        setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(0);
      } else {
        setAskedIds(newAskedIds);
        setQuestionHistory(prev => [...prev, { question: result.question, selectedAnswer: null, showResult: false }]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleReset = () => {
    setAskedIds([]);
    const result = getRandomQuestion();
    if (result) {
      setQuestionHistory([{ question: result.question, selectedAnswer: null, showResult: false }]);
      setHistoryIndex(0);
    }
    setStats({
      correct: 0,
      total: 0
    });
  };

  // Keyboard shortcuts - must be called unconditionally before any returns
  const shortcuts: KeyboardShortcut[] = [
    { key: 'a', description: 'Select A', action: () => handleSelectAnswer('A'), disabled: showResult || !question },
    { key: 'b', description: 'Select B', action: () => handleSelectAnswer('B'), disabled: showResult || !question },
    { key: 'c', description: 'Select C', action: () => handleSelectAnswer('C'), disabled: showResult || !question },
    { key: 'd', description: 'Select D', action: () => handleSelectAnswer('D'), disabled: showResult || !question },
    { key: 'ArrowRight', description: 'Next', action: handleNextQuestion, disabled: !showResult },
    { key: 'ArrowLeft', description: 'Previous', action: handlePreviousQuestion, disabled: !canGoBack },
    { key: 's', description: 'Skip', action: handleSkip, disabled: showResult || !question },
  ];

  useKeyboardShortcuts(shortcuts, { enabled: topicView === 'practice' });

  if (isLoading) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </PageContainer>
    );
  }

  // Show subelement selection list
  if (topicView === 'list' || !selectedSubelement) {
    return (
      <PageContainer width="standard" mobileNavPadding>
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
                      {getSubelementName(sub)}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </motion.button>;
          })}
        </div>
      </PageContainer>
    );
  }

  // Show question list view
  if (topicView === 'questions') {
    return (
      <QuestionListView
        title={getSubelementName(selectedSubelement)}
        subtitle={`Subelement ${selectedSubelement}`}
        badge={selectedSubelement}
        questions={currentQuestions}
        onBack={handleBackToList}
        onStartPractice={handleStartPractice}
        description={TOPIC_DESCRIPTIONS[selectedSubelement] || undefined}
      />
    );
  }

  // Show practice view
  if (!question) {
    return (
      <PageContainer width="standard" mobileNavPadding className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </PageContainer>
    );
  }

  const isViewingHistory = historyIndex < questionHistory.length - 1;
  const percentage = stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0;
  const progress = Math.round(askedIds.length / currentQuestions.length * 100);

  return (
    <PageContainer width="standard" mobileNavPadding>
      {/* Header - Refined Minimal */}
      <div className="mb-12">
        {/* Top row: Back button and topic name */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={handleBackToQuestions} className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Question List
          </Button>
          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <span className="font-mono text-sm text-muted-foreground">
              {selectedSubelement}
            </span>
          </div>
        </div>

        {/* Progress & Stats - Unified Minimal */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Progress bar - primary visual element */}
          <div className="relative">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Inline stats below progress */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 font-mono text-muted-foreground">
              <span className="text-success font-medium">{stats.correct}</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-destructive font-medium">{stats.total - stats.correct}</span>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <span className="text-primary font-medium">{percentage}%</span>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <span className="text-muted-foreground">
                {askedIds.length}/{currentQuestions.length}
              </span>
              {askedIds.length === currentQuestions.length && (
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sr-only">Reset</span>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard question={question} selectedAnswer={selectedAnswer} onSelectAnswer={handleSelectAnswer} showResult={showResult} enableGlossaryHighlight onTopicClick={navigateToTopic} />

      {/* Actions */}
      <div className="mt-10 flex justify-center gap-4">
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
    </PageContainer>
  );
}
