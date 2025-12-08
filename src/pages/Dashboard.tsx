import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PracticeTest } from '@/components/PracticeTest';
import { RandomPractice } from '@/components/RandomPractice';
import { WeakQuestionsReview } from '@/components/WeakQuestionsReview';
import { BookmarkedQuestions } from '@/components/BookmarkedQuestions';
import { SubelementPractice } from '@/components/SubelementPractice';
import { TestResultReview } from '@/components/TestResultReview';
import { AppLayout } from '@/components/AppLayout';
import { Glossary } from '@/components/Glossary';
import { GlossaryFlashcards } from '@/components/GlossaryFlashcards';
import { TestType, testTypes } from '@/components/DashboardSidebar';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const { currentView, setCurrentView, reviewingTestId, setReviewingTestId } = useAppNavigation();
  const [selectedTest, setSelectedTest] = useState<TestType>('technician');
  const [testInProgress, setTestInProgress] = useState(false);
  const [pendingView, setPendingView] = useState<typeof currentView | null>(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const { data: testResults, isLoading: testsLoading } = useQuery({
    queryKey: ['test-results', user?.id, selectedTest],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_test_results')
        .select('*')
        .eq('user_id', user!.id)
        .eq('test_type', selectedTest === 'technician' ? 'practice' : selectedTest)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: questionAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['question-attempts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('best_streak')
        .eq('id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate weak questions (questions answered incorrectly more than once)
  const weakQuestionIds = questionAttempts
    ? Object.entries(
        questionAttempts.reduce((acc, attempt) => {
          if (!attempt.is_correct) {
            acc[attempt.question_id] = (acc[attempt.question_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      )
        .filter(([_, count]) => count >= 1)
        .map(([id]) => id)
    : [];

  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  // Handle view changes with test-in-progress check
  const handleViewChange = (view: typeof currentView) => {
    if (testInProgress && view !== 'practice-test') {
      setPendingView(view);
      setShowNavigationWarning(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingView) {
      setTestInProgress(false);
      setCurrentView(pendingView);
      setPendingView(null);
    }
    setShowNavigationWarning(false);
  };

  const handleCancelNavigation = () => {
    setPendingView(null);
    setShowNavigationWarning(false);
  };

  // Render content based on view
  const renderContent = () => {
    if (currentView === 'practice-test') {
      return <PracticeTest onBack={() => setCurrentView('dashboard')} onTestStateChange={setTestInProgress} />;
    }

    if (currentView === 'random-practice') {
      return <RandomPractice onBack={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'weak-questions') {
      return <WeakQuestionsReview weakQuestionIds={weakQuestionIds} onBack={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'bookmarks') {
      return <BookmarkedQuestions onBack={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'subelement-practice') {
      return <SubelementPractice onBack={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'review-test' && reviewingTestId) {
      return <TestResultReview testResultId={reviewingTestId} onBack={() => {
        setReviewingTestId(null);
        setCurrentView('dashboard');
      }} />;
    }

    if (currentView === 'glossary') {
      return <Glossary onStartFlashcards={() => setCurrentView('glossary-flashcards')} />;
    }

    if (currentView === 'glossary-flashcards') {
      return <GlossaryFlashcards onBack={() => setCurrentView('glossary')} />;
    }

    if (authLoading || testsLoading || attemptsLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) return null;

    // Calculate stats
    const totalTests = testResults?.length || 0;
    const passedTests = testResults?.filter(t => t.passed).length || 0;
    const avgScore = totalTests > 0 
      ? Math.round(testResults!.reduce((sum, t) => sum + Number(t.percentage), 0) / totalTests) 
      : 0;
    
    const totalAttempts = questionAttempts?.length || 0;
    const correctAttempts = questionAttempts?.filter(a => a.is_correct).length || 0;
    const overallAccuracy = totalAttempts > 0 
      ? Math.round((correctAttempts / totalAttempts) * 100) 
      : 0;

    const recentTests = testResults?.slice(0, 3) || [];

    // Calculate test readiness
    const lastFiveTests = testResults?.slice(0, 5) || [];
    const recentPassCount = lastFiveTests.filter(t => t.passed).length;
    const recentAvgScore = lastFiveTests.length > 0
      ? Math.round(lastFiveTests.reduce((sum, t) => sum + Number(t.percentage), 0) / lastFiveTests.length)
      : 0;
    
    // Readiness levels: not-started, needs-work, getting-close, ready
    type ReadinessLevel = 'not-started' | 'needs-work' | 'getting-close' | 'ready';
    let readinessLevel: ReadinessLevel = 'not-started';
    let readinessMessage = "Take some practice tests to see your readiness";
    
    if (totalTests >= 1) {
      if (recentAvgScore >= 85 && recentPassCount >= Math.min(3, lastFiveTests.length)) {
        readinessLevel = 'ready';
        readinessMessage = "You're ready to take the real exam!";
      } else if (recentAvgScore >= 74 && recentPassCount >= 1) {
        readinessLevel = 'getting-close';
        readinessMessage = "Almost there! A few more passing scores and you'll be ready";
      } else {
        readinessLevel = 'needs-work';
        readinessMessage = "Keep practicing to improve your scores";
      }
    }

    const readinessConfig = {
      'not-started': { 
        color: 'text-muted-foreground', 
        bg: 'bg-secondary', 
        border: 'border-border',
        icon: Target,
        progress: 0
      },
      'needs-work': { 
        color: 'text-foreground', 
        bg: 'bg-secondary', 
        border: 'border-border',
        icon: TrendingUp,
        progress: 33
      },
      'getting-close': { 
        color: 'text-primary', 
        bg: 'bg-primary/10', 
        border: 'border-primary/30',
        icon: TrendingUp,
        progress: 66
      },
      'ready': { 
        color: 'text-success', 
        bg: 'bg-success/10', 
        border: 'border-success/30',
        icon: CheckCircle,
        progress: 100
      },
    };

    const config = readinessConfig[readinessLevel];
    const ReadinessIcon = config.icon;

    return (
      <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-8 radio-wave-bg">
        <div className="max-w-4xl mx-auto">

          {/* Test Readiness Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-4 mb-6 border",
              config.bg,
              config.border
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                readinessLevel === 'ready' ? 'bg-success/20' : 
                readinessLevel === 'getting-close' ? 'bg-primary/20' : 'bg-secondary'
              )}>
                <ReadinessIcon className={cn("w-6 h-6", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className={cn("font-mono font-bold", config.color)}>
                    {readinessLevel === 'not-started' ? 'Test Readiness' :
                     readinessLevel === 'needs-work' ? 'Keep Studying' :
                     readinessLevel === 'getting-close' ? 'Almost Ready' :
                     'Ready to Test!'}
                  </h2>
                  {totalTests > 0 && (
                    <span className="text-sm font-mono text-muted-foreground">
                      {recentAvgScore}% avg
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{readinessMessage}</p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${config.progress}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={cn(
                      "h-full rounded-full",
                      readinessLevel === 'ready' ? 'bg-success' :
                      readinessLevel === 'getting-close' ? 'bg-primary' :
                      'bg-muted-foreground/30'
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
          >
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Tests</span>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">{totalTests}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">Passed</span>
              </div>
              <p className="text-2xl font-mono font-bold text-success">{passedTests}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Avg Score</span>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">{avgScore}%</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Questions</span>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">{totalAttempts}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Best Streak</span>
              </div>
              <p className="text-2xl font-mono font-bold text-primary">{profile?.best_streak || 0}</p>
            </div>
          </motion.div>

          {/* Accuracy Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Accuracy</span>
              <span className="text-lg font-mono font-bold text-primary">{overallAccuracy}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                style={{ width: `${overallAccuracy}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="w-3 h-3" /> {correctAttempts}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="w-3 h-3" /> {totalAttempts - correctAttempts}
              </span>
            </div>
          </motion.div>

          {/* Recent Tests */}
          {recentTests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <h2 className="text-sm font-mono font-bold text-foreground mb-3">Recent Tests</h2>
              <div className="space-y-2">
                {recentTests.map((test) => (
                  <button 
                    key={test.id}
                    onClick={() => {
                      setReviewingTestId(test.id);
                      setCurrentView('review-test');
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                      test.passed 
                        ? "border-success/30 bg-success/5 hover:bg-success/10" 
                        : "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        test.passed 
                          ? "bg-success text-success-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      )}>
                        {test.passed ? '✓' : '✗'}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">
                          {test.score}/{test.total_questions}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-lg font-mono font-bold",
                        test.passed ? "text-success" : "text-destructive"
                      )}>
                        {test.percentage}%
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Navigation Warning Dialog */}
      <AlertDialog open={showNavigationWarning} onOpenChange={setShowNavigationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Test in Progress
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have a practice test in progress. If you leave now, your progress will not be saved. Are you sure you want to end the test?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Return to Test
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppLayout 
        currentView={currentView} 
        onViewChange={handleViewChange}
        selectedTest={selectedTest}
        onTestChange={setSelectedTest}
      >
        {renderContent()}
      </AppLayout>
    </>
  );
}
