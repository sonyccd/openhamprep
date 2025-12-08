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
  Flame,
  BookText,
  Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

  // Fetch glossary terms count
  const { data: glossaryTerms = [] } = useQuery({
    queryKey: ['glossary-terms-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch glossary progress
  const { data: glossaryProgress = [] } = useQuery({
    queryKey: ['glossary-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch glossary streak from profile
  const { data: glossaryStreak } = useQuery({
    queryKey: ['profile-glossary-streak', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('glossary_current_streak, glossary_best_streak, glossary_last_study_date')
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

    // Determine the best next action based on user's state
    const getNextAction = () => {
      // Priority 1: If never taken a test, start with a practice test
      if (totalTests === 0) {
        return {
          title: "Take Your First Practice Test",
          description: "See where you stand by taking a full practice exam. This will help identify your weak areas.",
          action: () => setCurrentView('practice-test'),
          actionLabel: "Start Practice Test",
          icon: Target,
          priority: 'start'
        };
      }

      // Priority 2: If failing tests, focus on weak questions
      if (weakQuestionIds.length > 5 && recentPassCount < 2) {
        return {
          title: "Review Your Weak Areas",
          description: `You have ${weakQuestionIds.length} questions you've missed. Focus on these to boost your score.`,
          action: () => setCurrentView('weak-questions'),
          actionLabel: "Practice Weak Questions",
          icon: Zap,
          priority: 'weak'
        };
      }

      // Priority 3: If close to passing, take more tests
      if (readinessLevel === 'getting-close') {
        return {
          title: "Keep Testing - You're Almost There!",
          description: "You're close to being exam-ready. Take a few more practice tests to build confidence.",
          action: () => setCurrentView('practice-test'),
          actionLabel: "Take Practice Test",
          icon: TrendingUp,
          priority: 'practice'
        };
      }

      // Priority 4: If ready, celebrate and suggest real exam
      if (readinessLevel === 'ready') {
        return {
          title: "You're Ready for the Real Exam!",
          description: "Your scores show you're prepared. Schedule your exam or take one more practice test.",
          action: () => setCurrentView('practice-test'),
          actionLabel: "One More Practice Test",
          icon: CheckCircle,
          priority: 'ready'
        };
      }

      // Default: Continue studying
      return {
        title: "Continue Your Study Session",
        description: "Practice makes perfect. Jump into random questions or focus on specific topics.",
        action: () => setCurrentView('random-practice'),
        actionLabel: "Random Practice",
        icon: Brain,
        priority: 'default'
      };
    };

    const nextAction = getNextAction();
    const NextActionIcon = nextAction.icon;

    // Calculate glossary stats for the compact display
    const totalTerms = glossaryTerms.length;
    const masteredTerms = glossaryProgress.filter(p => p.mastered).length;
    const glossaryPercentage = totalTerms > 0 ? Math.round((masteredTerms / totalTerms) * 100) : 0;

    // Get motivational message based on time of day and progress
    const getMotivationalMessage = () => {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
      
      // Progress-based messages
      if (readinessLevel === 'ready') {
        const readyMessages = [
          "You've put in the work. Time to get that license! 📻",
          "Your practice has paid off. You're exam ready!",
          "Confidence earned through preparation. Go get it!"
        ];
        return readyMessages[Math.floor(Math.random() * readyMessages.length)];
      }

      if (readinessLevel === 'getting-close') {
        const closeMessages = [
          "Almost there! A few more sessions and you'll be ready.",
          "Great progress! Keep pushing through the finish line.",
          "You're in the home stretch. Stay focused!"
        ];
        return closeMessages[Math.floor(Math.random() * closeMessages.length)];
      }

      if (weakQuestionIds.length > 10) {
        return "Focus on your weak areas today. Small improvements add up!";
      }

      if (totalTests === 0) {
        const newUserMessages: Record<string, string> = {
          morning: "Good morning! Ready to start your ham radio journey?",
          afternoon: "Great time to begin studying. Take your first practice test!",
          evening: "Evening study sessions can be very effective. Let's go!",
          night: "Night owl studying? Let's make some progress!"
        };
        return newUserMessages[timeOfDay];
      }

      // Time-based encouragement for regular users
      const timeMessages: Record<string, string[]> = {
        morning: [
          "Morning studies stick best. Great time to learn!",
          "Early bird catches the license! Let's study.",
          "Fresh mind, fresh start. Ready to practice?"
        ],
        afternoon: [
          "Afternoon study break? Perfect timing!",
          "Keep the momentum going this afternoon.",
          "A little progress each day leads to big results."
        ],
        evening: [
          "Wind down with some practice questions.",
          "Evening review helps lock in what you've learned.",
          "Consistent evening practice builds lasting knowledge."
        ],
        night: [
          "Late night study session? Your dedication is inspiring!",
          "Burning the midnight oil? Every bit of practice counts.",
          "Night study can be peaceful and productive."
        ]
      };

      const messages = timeMessages[timeOfDay];
      return messages[Math.floor(Math.random() * messages.length)];
    };

    const motivationalMessage = getMotivationalMessage();

    return (
      <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-8 radio-wave-bg">
        <div className="max-w-3xl mx-auto">

          {/* Motivational Greeting */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-4 italic"
          >
            {motivationalMessage}
          </motion.p>

          {/* Next Action Card - Primary Focus */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-6 mb-6 border-2",
              nextAction.priority === 'ready' ? "bg-success/10 border-success/40" :
              nextAction.priority === 'weak' ? "bg-orange-500/10 border-orange-500/40" :
              "bg-primary/10 border-primary/40"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
                nextAction.priority === 'ready' ? 'bg-success/20' :
                nextAction.priority === 'weak' ? 'bg-orange-500/20' :
                'bg-primary/20'
              )}>
                <NextActionIcon className={cn(
                  "w-7 h-7",
                  nextAction.priority === 'ready' ? 'text-success' :
                  nextAction.priority === 'weak' ? 'text-orange-500' :
                  'text-primary'
                )} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground mb-1">{nextAction.title}</h2>
                <p className="text-sm text-muted-foreground">{nextAction.description}</p>
              </div>
              <Button 
                size="lg" 
                onClick={nextAction.action}
                className={cn(
                  "shrink-0 gap-2",
                  nextAction.priority === 'ready' && "bg-success hover:bg-success/90",
                  nextAction.priority === 'weak' && "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {nextAction.actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Key Metrics - Compact Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
          >
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-mono font-bold text-foreground">{overallAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-mono font-bold text-success">{passedTests}/{totalTests}</p>
              <p className="text-xs text-muted-foreground">Tests Passed</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn(
                "text-2xl font-mono font-bold",
                weakQuestionIds.length > 10 ? "text-orange-500" : "text-foreground"
              )}>{weakQuestionIds.length}</p>
              <p className="text-xs text-muted-foreground">Weak Questions</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className={cn(
                  "text-2xl font-mono font-bold",
                  (profile?.best_streak || 0) > 0 ? "text-orange-500" : "text-muted-foreground"
                )}>{profile?.best_streak || 0}</p>
                {(profile?.best_streak || 0) > 0 && <Flame className="w-5 h-5 text-orange-500" />}
              </div>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </motion.div>

          {/* Two Column Layout: Recent Performance + Weak Areas */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Recent Performance Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <h3 className="text-sm font-mono font-bold text-foreground mb-3">Recent Performance</h3>
              {recentTests.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No tests yet. Take your first practice test!
                </p>
              ) : (
                <div className="space-y-2">
                  {recentTests.slice(0, 3).map((test, index) => (
                    <button 
                      key={test.id}
                      onClick={() => {
                        setReviewingTestId(test.id);
                        setCurrentView('review-test');
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                        "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                          test.passed 
                            ? "bg-success text-success-foreground" 
                            : "bg-destructive text-destructive-foreground"
                        )}>
                          {test.passed ? '✓' : '✗'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        test.passed ? "text-success" : "text-destructive"
                      )}>
                        {test.percentage}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Weak Areas Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <h3 className="text-sm font-mono font-bold text-foreground mb-3">Areas to Improve</h3>
              {weakQuestionIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-success mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No weak areas detected yet!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Questions to review</span>
                    <span className="text-lg font-mono font-bold text-orange-500">{weakQuestionIds.length}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => setCurrentView('weak-questions')}
                  >
                    <Zap className="w-4 h-4" />
                    Review Weak Questions
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Glossary Progress - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold text-foreground">Glossary</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {masteredTerms}/{totalTerms} terms
                </span>
                {(glossaryStreak?.glossary_current_streak || 0) > 0 && (
                  <span className="flex items-center gap-1 text-orange-500 text-sm font-bold">
                    {glossaryStreak?.glossary_current_streak}
                    <Flame className="w-4 h-4" />
                  </span>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setCurrentView('glossary-flashcards')}
                  className="gap-1"
                >
                  <Brain className="w-3 h-3" />
                  Study
                </Button>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                style={{ width: `${glossaryPercentage}%` }}
              />
            </div>
          </motion.div>

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
