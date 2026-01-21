import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useUserTargetExam } from '@/hooks/useExamSessions';
import { useTestReadiness } from '@/hooks/useTestReadiness';
import { useReadinessScore, recalculateReadiness } from '@/hooks/useReadinessScore';
import { supabase } from '@/integrations/supabase/client';
import { calculateWeakQuestionIds } from '@/lib/weakQuestions';
import { filterByTestType } from '@/lib/testTypeUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, Zap, Brain, Target, MapPin } from 'lucide-react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { PageContainer } from '@/components/ui/page-container';
import {
  DashboardHero,
  DashboardNextSteps,
  DashboardNotifications,
  DashboardProgress,
  DashboardSectionInsights,
  StreakDisplay,
} from '@/components/dashboard';
import type { NextStep } from '@/components/dashboard/DashboardNextSteps';
import { PracticeTest } from '@/components/PracticeTest';
import { RandomPractice } from '@/components/RandomPractice';
import { WeakQuestionsReview } from '@/components/WeakQuestionsReview';
import { BookmarkedQuestions } from '@/components/BookmarkedQuestions';
import { SubelementPractice } from '@/components/SubelementPractice';
import { ChapterPractice } from '@/components/ChapterPractice';
import { TestResultReview } from '@/components/TestResultReview';
import { AppLayout } from '@/components/AppLayout';
import { Glossary } from '@/components/Glossary';
import { GlossaryFlashcards } from '@/components/GlossaryFlashcards';
import { WeeklyGoalsModal } from '@/components/WeeklyGoalsModal';
import { ExamSessionSearch } from '@/components/ExamSessionSearch';
import { TopicGallery } from '@/components/TopicGallery';
import { TopicDetailPage } from '@/components/TopicDetailPage';
import { LessonGallery } from '@/components/LessonGallery';
import { LessonDetailPage } from '@/components/LessonDetailPage';
import { HamRadioToolsGallery } from '@/components/HamRadioToolsGallery';
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
    selectedLessonSlug,
    navigateToLessons,
    navigateBackFromTopic,
    navigateToSubelementPractice,
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
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut for search (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Expose search open function for sidebar button
  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

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

  // Use test readiness hook for calculations - use examType for database-backed readiness
  const {
    readinessLevel,
    readinessMessage,
    readinessTitle,
    recentAvgScore,
    nextAction,
  } = useTestReadiness({
    examType: selectedTest,
    weakQuestionCount: weakQuestionIds.length,
    testResults, // Fallback for when DB cache is empty
  });

  // Get subelement metrics for focus areas
  const { data: readinessData } = useReadinessScore(selectedTest);

  // Track if we've already attempted recalculation for this exam type to prevent infinite loops
  const recalculationAttempted = useRef<Record<string, boolean>>({});

  // Trigger recalculation if cache exists but subelement_metrics is missing (legacy cache)
  useEffect(() => {
    // Only attempt recalculation once per exam type per session
    if (recalculationAttempted.current[selectedTest]) {
      return;
    }

    if (readinessData && (!readinessData.subelement_metrics || Object.keys(readinessData.subelement_metrics).length === 0)) {
      recalculationAttempted.current[selectedTest] = true;
      recalculateReadiness(selectedTest).then(() => {
        queryClient.invalidateQueries({ queryKey: ['readiness', user?.id, selectedTest] });
      });
    }
  }, [readinessData, selectedTest, queryClient, user?.id]);

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
      return <PracticeTest
        onBack={() => changeView('dashboard')}
        onTestStateChange={setTestInProgress}
        testType={selectedTest}
        onReviewTest={(testId) => {
          setReviewingTestId(testId);
          changeView('review-test');
        }}
      />;
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
    if (currentView === 'chapter-practice') {
      return <ChapterPractice onBack={() => changeView('dashboard')} testType={selectedTest} />;
    }
    if (currentView === 'review-test' && reviewingTestId) {
      return <TestResultReview testResultId={reviewingTestId} onBack={() => {
        setReviewingTestId(null);
        changeView('dashboard');
      }} />;
    }
    if (currentView === 'glossary') {
      return <Glossary />;
    }
    if (currentView === 'glossary-flashcards') {
      return <GlossaryFlashcards onBack={() => changeView('dashboard')} />;
    }
    if (currentView === 'find-test-site') {
      return <ExamSessionSearch />;
    }
    if (currentView === 'tools') {
      return <HamRadioToolsGallery />;
    }
    if (currentView === 'topics') {
      return <TopicGallery testType={selectedTest} />;
    }
    if (currentView === 'topic-detail' && selectedTopicSlug) {
      return <TopicDetailPage slug={selectedTopicSlug} onBack={navigateBackFromTopic} />;
    }
    if (currentView === 'lessons') {
      return <LessonGallery testType={selectedTest} />;
    }
    if (currentView === 'lesson-detail' && selectedLessonSlug) {
      return <LessonDetailPage slug={selectedLessonSlug} onBack={navigateToLessons} />;
    }
    if (authLoading || testsLoading || attemptsLoading) {
      return <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>;
    }
    if (!user) return null;

    // Calculate weekly goal progress
    const questionsGoal = weeklyGoals?.questions_goal || 50;
    const testsGoal = weeklyGoals?.tests_goal || 2;

    // Handle primary action from hero based on nextAction priority
    const handlePrimaryAction = () => {
      switch (nextAction.priority) {
        case 'start':
        case 'practice':
        case 'ready':
          changeView('practice-test');
          break;
        case 'weak':
          changeView('weak-questions');
          break;
        default:
          changeView('random-practice');
          break;
      }
    };

    // Build smart next steps based on user state
    const getNextSteps = (): NextStep[] => {
      const steps: NextStep[] = [];

      // If weak questions > 5, show review weak questions
      if (weakQuestionIds.length > 5) {
        steps.push({
          id: 'weak',
          title: 'Review Weak Areas',
          description: `${weakQuestionIds.length} questions need attention`,
          icon: Zap,
          onClick: () => changeView('weak-questions'),
          badge: String(weakQuestionIds.length),
          variant: 'warning',
        });
      }

      // If haven't hit question goal, show random practice
      if (thisWeekQuestions < questionsGoal) {
        const remaining = questionsGoal - thisWeekQuestions;
        steps.push({
          id: 'practice',
          title: 'Practice Questions',
          description: `${remaining} more to reach your weekly goal`,
          icon: Brain,
          onClick: () => changeView('random-practice'),
          variant: 'secondary',
        });
      }

      // If haven't hit test goal, show practice test
      if (thisWeekTests < testsGoal) {
        steps.push({
          id: 'test',
          title: 'Take a Practice Test',
          description: 'Test your knowledge with a full 35-question exam',
          icon: Target,
          onClick: () => changeView('practice-test'),
          variant: 'primary',
        });
      }

      // If exam ready but no target exam, suggest finding one
      if (readinessLevel === 'ready' && !userTarget?.exam_session) {
        steps.push({
          id: 'find-exam',
          title: 'Find an Exam Session',
          description: "You're ready! Schedule your real exam",
          icon: MapPin,
          onClick: () => changeView('find-test-site'),
          variant: 'primary',
        });
      }

      // Limit to 3 steps max
      return steps.slice(0, 3);
    };

    return (
      <PageContainer width="standard" radioWaveBg>
        <DashboardHero
          readinessLevel={readinessLevel}
          readinessTitle={readinessTitle}
          readinessMessage={readinessMessage}
          recentAvgScore={recentAvgScore}
          nextAction={nextAction}
          onAction={handlePrimaryAction}
        />

        <DashboardNotifications
          examType={selectedTest}
          userId={user?.id}
          thisWeekQuestions={thisWeekQuestions}
          questionsGoal={questionsGoal}
          thisWeekTests={thisWeekTests}
          testsGoal={testsGoal}
          userTarget={userTarget}
          onNavigate={changeView}
          maxVisible={1}
        />

        <div className="mb-6">
          <StreakDisplay onAction={() => changeView('random-practice')} />
        </div>

        <DashboardNextSteps steps={getNextSteps()} />

        <DashboardSectionInsights
          subelementMetrics={readinessData?.subelement_metrics}
          testType={selectedTest}
          onPracticeSection={navigateToSubelementPractice}
        />

        <DashboardProgress
          thisWeekQuestions={thisWeekQuestions}
          questionsGoal={questionsGoal}
          thisWeekTests={thisWeekTests}
          testsGoal={testsGoal}
          examDate={userTarget?.exam_session?.exam_date || userTarget?.custom_exam_date}
          examLocation={
            userTarget?.exam_session
              ? `${userTarget.exam_session.city}, ${userTarget.exam_session.state}`
              : userTarget?.custom_exam_date
                ? 'Custom date'
                : undefined
          }
          onOpenGoalsModal={() => setShowGoalsModal(true)}
          onFindTestSite={() => changeView('find-test-site')}
        />
      </PageContainer>
    );
  };
  return <>
      {/* Global Search Dialog */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        testType={selectedTest}
      />

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

      <AppLayout currentView={currentView} onViewChange={handleViewChange} selectedTest={selectedTest} onTestChange={setSelectedTest} onSearch={openSearch}>
        {renderContent()}
      </AppLayout>
    </>;
}