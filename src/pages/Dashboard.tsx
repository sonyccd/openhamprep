import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useUserTargetExam } from '@/hooks/useExamSessions';
import { useTestReadiness } from '@/hooks/useTestReadiness';
import { supabase } from '@/integrations/supabase/client';
import { calculateWeakQuestionIds } from '@/lib/weakQuestions';
import { filterByTestType } from '@/lib/testTypeUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import {
  DashboardStats,
  DashboardWeeklyGoals,
  DashboardRecentPerformance,
  DashboardWeakAreas,
  DashboardTargetExam,
  DashboardReadiness,
} from '@/components/dashboard';
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
import { TopicGallery } from '@/components/TopicGallery';
import { TopicDetailPage } from '@/components/TopicDetailPage';
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
    setReviewingTestId,
    selectedTopicSlug,
    navigateToTopics,
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
      navigate('/auth');
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
      } = await supabase
        .from('question_attempts')
        .select('*, questions!inner(display_name)')
        .eq('user_id', user!.id);
      if (error) throw error;
      // Flatten the joined data to include display_name at the top level
      return data?.map(attempt => ({
        ...attempt,
        display_name: attempt.questions?.display_name
      })) || [];
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

  // Filter question attempts by test type (based on display_name prefix, e.g., T1A01, G2B03)
  const filteredAttempts = filterByTestType(
    questionAttempts || [],
    selectedTest,
    (a) => a.display_name
  );

  const thisWeekTests = testResults?.filter(t => new Date(t.completed_at) >= weekStart).length || 0;
  const thisWeekQuestions = filteredAttempts.filter(a => new Date(a.attempted_at) >= weekStart).length || 0;

  // Calculate weak questions (questions where incorrect answers > correct answers) - filtered by test type
  const weakQuestionIds = filteredAttempts.length > 0 ? calculateWeakQuestionIds(filteredAttempts) : [];
  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  // Use test readiness hook for calculations
  const {
    readinessLevel,
    readinessMessage,
    readinessTitle,
    readinessProgress,
    recentAvgScore,
    totalTests,
    passedTests,
  } = useTestReadiness({
    testResults,
    weakQuestionCount: weakQuestionIds.length,
  });

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
    if (currentView === 'topics') {
      return <TopicGallery testType={selectedTest} />;
    }
    if (currentView === 'topic-detail' && selectedTopicSlug) {
      return <TopicDetailPage slug={selectedTopicSlug} onBack={navigateToTopics} />;
    }
    if (authLoading || testsLoading || attemptsLoading) {
      return <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>;
    }
    if (!user) return null;

    // Calculate stats (using filtered attempts for the selected test type)
    const totalAttempts = filteredAttempts.length;
    const correctAttempts = filteredAttempts.filter(a => a.is_correct).length;
    const overallAccuracy = totalAttempts > 0 ? Math.round(correctAttempts / totalAttempts * 100) : 0;
    const recentTests = testResults?.slice(0, 3) || [];

    // Calculate weekly goal progress
    const questionsGoal = weeklyGoals?.questions_goal || 50;
    const testsGoal = weeklyGoals?.tests_goal || 2;

    const handleReviewTest = (testId: string) => {
      setReviewingTestId(testId);
      changeView('review-test');
    };

    return (
      <PageContainer width="standard" radioWaveBg>
          <DashboardReadiness
            readinessLevel={readinessLevel}
            readinessTitle={readinessTitle}
            readinessMessage={readinessMessage}
            readinessProgress={readinessProgress}
            recentAvgScore={recentAvgScore}
            passedTests={passedTests}
            totalTests={totalTests}
            onStartPracticeTest={() => changeView('practice-test')}
          />

          <DashboardWeeklyGoals
            thisWeekQuestions={thisWeekQuestions}
            thisWeekTests={thisWeekTests}
            questionsGoal={questionsGoal}
            testsGoal={testsGoal}
            onOpenGoalsModal={() => setShowGoalsModal(true)}
            onStartRandomPractice={() => changeView('random-practice')}
            onStartPracticeTest={() => changeView('practice-test')}
          />

          <DashboardTargetExam
            userTarget={userTarget}
            onFindTestSite={() => changeView('find-test-site')}
          />

          <DashboardStats
            overallAccuracy={overallAccuracy}
            passedTests={passedTests}
            totalTests={totalTests}
            weakQuestionCount={weakQuestionIds.length}
            bestStreak={profile?.best_streak || 0}
          />

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <DashboardRecentPerformance
              recentTests={recentTests}
              onReviewTest={handleReviewTest}
            />
            <DashboardWeakAreas
              weakQuestionCount={weakQuestionIds.length}
              onReviewWeakQuestions={() => changeView('weak-questions')}
            />
          </div>
      </PageContainer>
    );
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

      <AppLayout currentView={currentView} onViewChange={handleViewChange} selectedTest={selectedTest} onTestChange={setSelectedTest}>
        {renderContent()}
      </AppLayout>
    </>;
}