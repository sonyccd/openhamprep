import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import { useQuestions, Question } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { BookOpen, SkipForward, RotateCcw, Loader2, ChevronRight, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TopicLanding } from "@/components/TopicLanding";

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
  T9: "Antennas & Feed Lines",
};

export function SubelementPractice({ onBack }: SubelementPracticeProps) {
  const { data: allQuestions, isLoading, error } = useQuestions();
  const { saveRandomAttempt } = useProgress();
  
  const [selectedSubelement, setSelectedSubelement] = useState<string | null>(null);
  const [topicView, setTopicView] = useState<TopicView>('list');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [askedIds, setAskedIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (selectedSubelement && topicView === 'practice' && currentQuestions.length > 0 && !question) {
      setQuestion(getRandomQuestion());
    }
  }, [selectedSubelement, topicView, currentQuestions, question, getRandomQuestion]);

  const handleSelectSubelement = (sub: string) => {
    setSelectedSubelement(sub);
    setTopicView('landing');
    setQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setStats({ correct: 0, total: 0 });
    setAskedIds([]);
  };

  const handleStartPractice = () => {
    setTopicView('practice');
    setQuestion(getRandomQuestion());
  };

  const handleBackToLanding = () => {
    setTopicView('landing');
    setQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleBackToList = () => {
    setSelectedSubelement(null);
    setTopicView('list');
    setQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setStats({ correct: 0, total: 0 });
    setAskedIds([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || !allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load questions</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Show subelement selection list
  if (topicView === 'list' || !selectedSubelement) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-end mb-8">
            <div className="flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5" />
              <span className="font-mono font-semibold">Study by Topic</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
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
              return (
                <motion.button
                  key={sub}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectSubelement(sub)}
                  className={cn(
                    "w-full p-4 rounded-xl border bg-card text-left",
                    "hover:bg-secondary hover:border-foreground/20 hover:shadow-lg",
                    "transition-all duration-200 group"
                  )}
                >
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
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show topic landing page
  if (topicView === 'landing') {
    return (
      <TopicLanding
        subelement={selectedSubelement}
        subelementName={SUBELEMENT_NAMES[selectedSubelement] || `Subelement ${selectedSubelement}`}
        questions={currentQuestions}
        onBack={handleBackToList}
        onStartPractice={handleStartPractice}
      />
    );
  }

  // Show practice view
  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectAnswer = async (answer: 'A' | 'B' | 'C' | 'D') => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === question.correctAnswer;
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    await saveRandomAttempt(question, answer);
  };

  const handleNextQuestion = () => {
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    setQuestion(getRandomQuestion(newAskedIds));
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleSkip = () => {
    const newAskedIds = [...askedIds, question.id];
    setAskedIds(newAskedIds);
    setQuestion(getRandomQuestion(newAskedIds));
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleReset = () => {
    setAskedIds([]);
    setQuestion(getRandomQuestion());
    setSelectedAnswer(null);
    setShowResult(false);
    setStats({ correct: 0, total: 0 });
  };

  const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const progress = Math.round((askedIds.length / currentQuestions.length) * 100);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleBackToLanding} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Topic Overview
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <span className="font-mono font-bold">{selectedSubelement}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {SUBELEMENT_NAMES[selectedSubelement] || `Subelement ${selectedSubelement}`}
            </span>
          </div>
        </div>

        {/* Progress & Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4"
        >
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
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {askedIds.length}/{currentQuestions.length}
            </span>
            {askedIds.length === currentQuestions.length && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Question */}
      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectAnswer}
        showResult={showResult}
      />

      {/* Actions */}
      <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-4">
        {!showResult ? (
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip Question
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} variant="default" size="lg" className="gap-2">
            Next Question
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}