import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useUserTargetExam } from '@/hooks/useExamSessions';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAppTour } from '@/hooks/useAppTour';
import { supabase } from '@/integrations/supabase/client';
import { calculateWeakQuestionIds } from '@/lib/weakQuestions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Target, Zap, TrendingUp, CheckCircle, Loader2, AlertTriangle, Flame, Brain, CalendarDays, Settings2, MapPin } from 'lucide-react';
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
import { WeeklyGoalsModal } from '@/components/WeeklyGoalsModal';
import { ExamSessionSearch } from '@/components/ExamSessionSearch';
import { WelcomeModal } from '@/components/WelcomeModal';
import { TestType, testTypes, View } from '@/types/navigation';
export default function Dashboard() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    bookmarks
  } = useBookmarks();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    currentView,
    setCurrentView,
    reviewingTestId,
    setReviewingTestId
  } = useAppNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Persist selectedTest in localStorage
  const [selectedTest, setSelectedTest] = useState<TestType>(() => {
    const saved = localStorage.getItem('selectedTestType');
    return (saved as TestType) || 'technician';
  });

  // Save selectedTest to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedTestType', selectedTest);
  }, [selectedTest]);
  const [testInProgress, setTestInProgress] = useState(false);
  const [pendingView, setPendingView] = useState<typeof currentView | null>(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Mobile menu state for sidebar (controlled by tour)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);

  // Onboarding
  const {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { startTour } = useAppTour({
    onComplete: () => {
      setIsTourActive(false);
      setMobileMenuOpen(false);
      completeOnboarding();
    },
    onCancel: () => {
      setIsTourActive(false);
      setMobileMenuOpen(false);
      skipOnboarding();
    },
    onOpenMobileMenu: () => setMobileMenuOpen(true),
    onCloseMobileMenu: () => setMobileMenuOpen(false),
  });

  // Show welcome modal when onboarding should start
  useEffect(() => {
    if (showOnboarding && user && !authLoading) {
      // Small delay to ensure the dashboard has loaded
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, user, authLoading]);

  const handleWelcomeComplete = (selectedLicense: TestType) => {
    setSelectedTest(selectedLicense);
    setShowWelcomeModal(false);
    setShowOnboarding(false);
    // Start the tour after a short delay to let the modal close
    setTimeout(() => {
      setIsTourActive(true);
      startTour();
    }, 300);
  };

  const handleWelcomeSkip = () => {
    setShowWelcomeModal(false);
    skipOnboarding();
  };

  // Handle view from URL query parameter (only on initial load)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && viewParam !== currentView) {
      setCurrentView(viewParam as typeof currentView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Helper to change view and update URL
  const changeView = (view: View) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      // Clear the view param when going to dashboard
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ view }, { replace: true });
    }
  };
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  const {
    data: testResults,
    isLoading: testsLoading
  } = useQuery({
    queryKey: ['test-results', user?.id, selectedTest],
    queryFn: async () => {
      // Handle both legacy 'practice' test_type and new test type values
      const testTypesToMatch = selectedTest === 'technician'
        ? ['practice', 'technician']  // Include legacy 'practice' for backward compatibility
        : [selectedTest];

      const {
        data,
        error
      } = await supabase.from('practice_test_results').select('*').eq('user_id', user!.id).in('test_type', testTypesToMatch).order('completed_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
  const {
    data: questionAttempts,
    isLoading: attemptsLoading
  } = useQuery({
    queryKey: ['question-attempts', user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('question_attempts').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
  const {
    data: profile
  } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('profiles').select('best_streak').eq('id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch weekly study goals
  const {
    data: weeklyGoals
  } = useQuery({
    queryKey: ['weekly-goals', user?.id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('weekly_study_goals').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch user's target exam
  const { data: userTarget } = useUserTargetExam(user?.id);

  // Calculate this week's progress (Sunday to Saturday)
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };
  const weekStart = getWeekStart();

  // Get question ID prefix for current test type
  const testTypePrefix = selectedTest === 'technician' ? 'T' : selectedTest === 'general' ? 'G' : 'E';

  // Filter question attempts by test type (based on question_id prefix)
  const filteredAttempts = questionAttempts?.filter(a => a.question_id.startsWith(testTypePrefix)) || [];

  const thisWeekTests = testResults?.filter(t => new Date(t.completed_at) >= weekStart).length || 0;
  const thisWeekQuestions = filteredAttempts.filter(a => new Date(a.attempted_at) >= weekStart).length || 0;

  // Calculate weak questions (questions where incorrect answers > correct answers) - filtered by test type
  const weakQuestionIds = filteredAttempts.length > 0 ? calculateWeakQuestionIds(filteredAttempts) : [];
  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  // Handle view changes with test-in-progress check
  const handleViewChange = (view: typeof currentView) => {
    if (testInProgress && view !== 'practice-test') {
      setPendingView(view);
      setShowNavigationWarning(true);
    } else {
      changeView(view);
    }
  };
  const handleConfirmNavigation = () => {
    if (pendingView) {
      setTestInProgress(false);
      changeView(pendingView);
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
      return <PracticeTest onBack={() => changeView('dashboard')} onTestStateChange={setTestInProgress} testType={selectedTest} />;
    }
    if (currentView === 'random-practice') {
      return <RandomPractice onBack={() => changeView('dashboard')} testType={selectedTest} />;
    }
    if (currentView === 'weak-questions') {
      return <WeakQuestionsReview weakQuestionIds={weakQuestionIds} onBack={() => changeView('dashboard')} testType={selectedTest} />;
    }
    if (currentView === 'bookmarks') {
      return <BookmarkedQuestions onBack={() => changeView('dashboard')} onStartPractice={() => changeView('random-practice')} testType={selectedTest} />;
    }
    if (currentView === 'subelement-practice') {
      return <SubelementPractice onBack={() => changeView('dashboard')} testType={selectedTest} />;
    }
    if (currentView === 'review-test' && reviewingTestId) {
      return <TestResultReview testResultId={reviewingTestId} onBack={() => {
        setReviewingTestId(null);
        changeView('dashboard');
      }} />;
    }
    if (currentView === 'glossary') {
      return <Glossary onStartFlashcards={() => changeView('glossary-flashcards')} />;
    }
    if (currentView === 'glossary-flashcards') {
      return <GlossaryFlashcards onBack={() => changeView('glossary')} />;
    }
    if (currentView === 'find-test-site') {
      return <ExamSessionSearch />;
    }
    if (authLoading || testsLoading || attemptsLoading) {
      return <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>;
    }
    if (!user) return null;

    // Calculate stats (using filtered attempts for the selected test type)
    const totalTests = testResults?.length || 0;
    const passedTests = testResults?.filter(t => t.passed).length || 0;
    const avgScore = totalTests > 0 ? Math.round(testResults!.reduce((sum, t) => sum + Number(t.percentage), 0) / totalTests) : 0;
    const totalAttempts = filteredAttempts.length;
    const correctAttempts = filteredAttempts.filter(a => a.is_correct).length;
    const overallAccuracy = totalAttempts > 0 ? Math.round(correctAttempts / totalAttempts * 100) : 0;
    const recentTests = testResults?.slice(0, 3) || [];

    // Calculate test readiness
    const lastFiveTests = testResults?.slice(0, 5) || [];
    const recentPassCount = lastFiveTests.filter(t => t.passed).length;
    const recentAvgScore = lastFiveTests.length > 0 ? Math.round(lastFiveTests.reduce((sum, t) => sum + Number(t.percentage), 0) / lastFiveTests.length) : 0;

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
      }
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
          action: () => changeView('practice-test'),
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
          action: () => changeView('weak-questions'),
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
          action: () => changeView('practice-test'),
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
          action: () => changeView('practice-test'),
          actionLabel: "One More Practice Test",
          icon: CheckCircle,
          priority: 'ready'
        };
      }

      // Default: Continue studying
      return {
        title: "Continue Your Study Session",
        description: "Practice makes perfect. Jump into random questions or focus on specific topics.",
        action: () => changeView('random-practice'),
        actionLabel: "Random Practice",
        icon: Brain,
        priority: 'default'
      };
    };
    const nextAction = getNextAction();
    const NextActionIcon = nextAction.icon;

    // Get motivational message based on time of day and progress
    const getMotivationalMessage = () => {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

      // Progress-based messages
      if (readinessLevel === 'ready') {
        const readyMessages = ["You've put in the work. Time to get that license! 📻", "Your practice has paid off. You're exam ready!", "Confidence earned through preparation. Go get it!"];
        return readyMessages[Math.floor(Math.random() * readyMessages.length)];
      }
      if (readinessLevel === 'getting-close') {
        const closeMessages = ["Almost there! A few more sessions and you'll be ready.", "Great progress! Keep pushing through the finish line.", "You're in the home stretch. Stay focused!"];
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
        morning: ["Morning studies stick best. Great time to learn!", "Early bird catches the license! Let's study.", "Fresh mind, fresh start. Ready to practice?"],
        afternoon: ["Afternoon study break? Perfect timing!", "Keep the momentum going this afternoon.", "A little progress each day leads to big results."],
        evening: ["Wind down with some practice questions.", "Evening review helps lock in what you've learned.", "Consistent evening practice builds lasting knowledge."],
        night: ["Late night study session? Your dedication is inspiring!", "Burning the midnight oil? Every bit of practice counts.", "Night study can be peaceful and productive."]
      };
      const messages = timeMessages[timeOfDay];
      return messages[Math.floor(Math.random() * messages.length)];
    };
    const motivationalMessage = getMotivationalMessage();

    // Calculate weekly goal progress
    const questionsGoal = weeklyGoals?.questions_goal || 50;
    const testsGoal = weeklyGoals?.tests_goal || 2;
    const questionsProgress = Math.min(100, Math.round(thisWeekQuestions / questionsGoal * 100));
    const testsProgress = Math.min(100, Math.round(thisWeekTests / testsGoal * 100));
    return <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 md:px-8 radio-wave-bg">
        <div className="max-w-3xl mx-auto">

          {/* Motivational Greeting */}
          

          {/* Test Readiness with Next Action */}
          <motion.div initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} data-tour="dashboard-readiness" className={cn("rounded-xl p-5 mb-6 border-2", readinessLevel === 'ready' ? "bg-success/10 border-success/50" : readinessLevel === 'getting-close' ? "bg-primary/10 border-primary/50" : readinessLevel === 'needs-work' ? "bg-orange-500/10 border-orange-500/50" : "bg-secondary border-border")}>
            <div className="flex items-center gap-4 mb-3">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-2xl font-bold", readinessLevel === 'ready' ? 'bg-success/20 text-success' : readinessLevel === 'getting-close' ? 'bg-primary/20 text-primary' : readinessLevel === 'needs-work' ? 'bg-orange-500/20 text-orange-500' : 'bg-secondary text-muted-foreground')}>
                {recentAvgScore > 0 ? `${recentAvgScore}%` : '—'}
              </div>
              <div className="flex-1">
                <h2 className={cn("text-lg font-bold", readinessLevel === 'ready' ? 'text-success' : readinessLevel === 'getting-close' ? 'text-primary' : readinessLevel === 'needs-work' ? 'text-orange-500' : 'text-foreground')}>
                  {readinessLevel === 'not-started' ? 'Test Readiness Unknown' : readinessLevel === 'needs-work' ? 'Not Ready Yet' : readinessLevel === 'getting-close' ? 'Almost Ready!' : 'Ready to Pass!'}
                </h2>
                <p className="text-sm text-muted-foreground">{readinessMessage}</p>
              </div>
              {readinessLevel === 'ready' && <CheckCircle className="w-8 h-8 text-success shrink-0" />}
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
              <motion.div initial={{
              width: 0
            }} animate={{
              width: `${readinessLevel === 'ready' ? 100 : readinessLevel === 'getting-close' ? 75 : readinessLevel === 'needs-work' ? 40 : 0}%`
            }} transition={{
              duration: 0.5,
              delay: 0.2
            }} className={cn("h-full rounded-full", readinessLevel === 'ready' ? 'bg-success' : readinessLevel === 'getting-close' ? 'bg-primary' : readinessLevel === 'needs-work' ? 'bg-orange-500' : 'bg-muted-foreground/30')} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Need 74% to pass</span>
              <span>{passedTests}/{totalTests} tests passed</span>
            </div>

            {/* CTA for new users */}
            {readinessLevel === 'not-started' && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col items-center">
                <Button
                  onClick={() => changeView('practice-test')}
                  className="gap-2"
                >
                  <Target className="w-4 h-4" />
                  Take Your First Practice Test
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  See where you stand and identify areas to focus on
                </p>
              </div>
            )}
          </motion.div>

          {/* Weekly Goals */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.05
        }} className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-mono font-bold text-foreground">This Week</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Resets Sunday
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowGoalsModal(true)}>
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Questions</span>
                  <span className={cn("font-mono font-bold", thisWeekQuestions >= questionsGoal ? "text-success" : "text-foreground")}>
                    {thisWeekQuestions}/{questionsGoal}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full transition-all duration-500 rounded-full", thisWeekQuestions >= questionsGoal ? "bg-success" : "bg-primary")} style={{
                  width: `${questionsProgress}%`
                }} />
                </div>
                {thisWeekQuestions >= questionsGoal ? <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3 h-3" />
                    <span>Goal reached!</span>
                  </div> : <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1" onClick={() => changeView('random-practice')}>
                    <Brain className="w-3 h-3" />
                    Practice Questions
                  </Button>}
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Practice Tests</span>
                  <span className={cn("font-mono font-bold", thisWeekTests >= testsGoal ? "text-success" : "text-foreground")}>
                    {thisWeekTests}/{testsGoal}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full transition-all duration-500 rounded-full", thisWeekTests >= testsGoal ? "bg-success" : "bg-primary")} style={{
                  width: `${testsProgress}%`
                }} />
                </div>
                {thisWeekTests >= testsGoal ? <div className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-3 h-3" />
                    <span>Goal reached!</span>
                  </div> : <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1" onClick={() => changeView('practice-test')}>
                    <Target className="w-3 h-3" />
                    Take a Test
                  </Button>}
              </div>
            </div>
          </motion.div>

          {/* Target Exam Card */}
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.075
          }} className={cn(
            "rounded-xl p-4 mb-6 border",
            userTarget ? "bg-card border-border" : "bg-primary/5 border-primary/30"
          )}>
            {userTarget?.exam_session ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {userTarget.exam_session.location_name || userTarget.exam_session.title || 'Exam Session'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userTarget.exam_session.exam_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })} • {userTarget.exam_session.city}, {userTarget.exam_session.state}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => changeView('find-test-site')}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">No exam date selected</p>
                  <p className="text-sm text-muted-foreground">Find a test session near you</p>
                </div>
                <Button size="sm" onClick={() => changeView('find-test-site')}>
                  Find Test Site
                </Button>
              </div>
            )}
          </motion.div>

          {/* Key Metrics - Compact Row */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-mono font-bold text-foreground">{overallAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-mono font-bold text-success">{passedTests}/{totalTests}</p>
              <p className="text-xs text-muted-foreground">Tests Passed</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn("text-2xl font-mono font-bold", weakQuestionIds.length > 10 ? "text-orange-500" : "text-foreground")}>{weakQuestionIds.length}</p>
              <p className="text-xs text-muted-foreground">Weak Questions</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className={cn("text-2xl font-mono font-bold", (profile?.best_streak || 0) > 0 ? "text-orange-500" : "text-muted-foreground")}>{profile?.best_streak || 0}</p>
                {(profile?.best_streak || 0) > 0 && <Flame className="w-5 h-5 text-orange-500" />}
              </div>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </motion.div>

          {/* Two Column Layout: Recent Performance + Weak Areas */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Recent Performance Trend */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.15
          }} className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-mono font-bold text-foreground mb-3">Recent Performance</h3>
              {recentTests.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">
                  No tests yet. Take your first practice test!
                </p> : <div className="space-y-2">
                  {recentTests.slice(0, 3).map((test, index) => <button key={test.id} onClick={() => {
                setReviewingTestId(test.id);
                changeView('review-test');
              }} className={cn("w-full flex items-center justify-between p-2 rounded-lg transition-colors", "hover:bg-secondary/50")}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", test.passed ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
                          {test.passed ? '✓' : '✗'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={cn("text-sm font-mono font-bold", test.passed ? "text-success" : "text-destructive")}>
                        {test.percentage}%
                      </span>
                    </button>)}
                </div>}
            </motion.div>

            {/* Weak Areas Summary */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }} className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-mono font-bold text-foreground mb-3">Areas to Improve</h3>
              {weakQuestionIds.length === 0 ? <div className="flex flex-col items-center justify-center py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-success mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No weak areas detected yet!
                  </p>
                </div> : <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Questions to review</span>
                    <span className="text-lg font-mono font-bold text-orange-500">{weakQuestionIds.length}</span>
                  </div>
                  <Button variant="outline" className="w-full gap-2 border-orange-500/30 text-orange-500 hover:bg-orange-500/10" onClick={() => changeView('weak-questions')}>
                    <Zap className="w-4 h-4" />
                    Review Weak Questions
                  </Button>
                </div>}
            </motion.div>
          </div>


        </div>
      </div>;
  };
  return <>
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

      {/* Weekly Goals Modal */}
      {user && <WeeklyGoalsModal open={showGoalsModal} onOpenChange={setShowGoalsModal} userId={user.id} currentGoals={weeklyGoals || null} onGoalsUpdated={() => queryClient.invalidateQueries({
      queryKey: ['weekly-goals', user.id]
    })} />}

      {/* Welcome Modal for Onboarding */}
      <WelcomeModal
        open={showWelcomeModal}
        onComplete={handleWelcomeComplete}
        onSkip={handleWelcomeSkip}
      />

      <AppLayout currentView={currentView} onViewChange={handleViewChange} selectedTest={selectedTest} onTestChange={setSelectedTest} mobileMenuOpen={mobileMenuOpen} onMobileMenuChange={setMobileMenuOpen} isTourActive={isTourActive}>
        {renderContent()}
      </AppLayout>
    </>;
}