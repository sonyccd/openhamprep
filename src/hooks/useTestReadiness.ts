import { useMemo } from 'react';
import { Target, Zap, TrendingUp, CheckCircle, Brain, LucideIcon } from 'lucide-react';
import {
  ReadinessLevel,
  READINESS_CONFIG,
  calculateReadinessLevel,
  getReadinessMessage,
  getReadinessTitle,
  getReadinessProgress,
} from '@/lib/readinessConfig';

interface TestResult {
  id: string;
  percentage: number | string;
  passed: boolean;
  completed_at: string;
}

interface NextAction {
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  priority: 'start' | 'weak' | 'practice' | 'ready' | 'default';
}

interface TestReadinessResult {
  readinessLevel: ReadinessLevel;
  readinessMessage: string;
  readinessTitle: string;
  readinessProgress: number;
  config: typeof READINESS_CONFIG[ReadinessLevel];
  recentAvgScore: number;
  totalTests: number;
  passedTests: number;
  nextAction: NextAction;
}

interface UseTestReadinessOptions {
  testResults: TestResult[] | undefined;
  weakQuestionCount: number;
}

export function useTestReadiness({
  testResults,
  weakQuestionCount,
}: UseTestReadinessOptions): TestReadinessResult {
  return useMemo(() => {
    const totalTests = testResults?.length || 0;
    const passedTests = testResults?.filter((t) => t.passed).length || 0;

    // Calculate from last 5 tests
    const lastFiveTests = testResults?.slice(0, 5) || [];
    const recentPassCount = lastFiveTests.filter((t) => t.passed).length;
    const recentAvgScore =
      lastFiveTests.length > 0
        ? Math.round(
            lastFiveTests.reduce((sum, t) => sum + Number(t.percentage), 0) /
              lastFiveTests.length
          )
        : 0;

    const readinessLevel = calculateReadinessLevel(
      totalTests,
      recentAvgScore,
      recentPassCount,
      lastFiveTests.length
    );

    const readinessMessage = getReadinessMessage(readinessLevel);
    const readinessTitle = getReadinessTitle(readinessLevel);
    const readinessProgress = getReadinessProgress(readinessLevel);
    const config = READINESS_CONFIG[readinessLevel];

    // Determine next action
    const nextAction = getNextAction(
      totalTests,
      weakQuestionCount,
      recentPassCount,
      readinessLevel
    );

    return {
      readinessLevel,
      readinessMessage,
      readinessTitle,
      readinessProgress,
      config,
      recentAvgScore,
      totalTests,
      passedTests,
      nextAction,
    };
  }, [testResults, weakQuestionCount]);
}

function getNextAction(
  totalTests: number,
  weakQuestionCount: number,
  recentPassCount: number,
  readinessLevel: ReadinessLevel
): NextAction {
  // Priority 1: If never taken a test, start with a practice test
  if (totalTests === 0) {
    return {
      title: 'Take Your First Practice Test',
      description:
        'See where you stand by taking a full practice exam. This will help identify your weak areas.',
      actionLabel: 'Start Practice Test',
      icon: Target,
      priority: 'start',
    };
  }

  // Priority 2: If failing tests, focus on weak questions
  if (weakQuestionCount > 5 && recentPassCount < 2) {
    return {
      title: 'Review Your Weak Areas',
      description: `You have ${weakQuestionCount} questions you've missed. Focus on these to boost your score.`,
      actionLabel: 'Practice Weak Questions',
      icon: Zap,
      priority: 'weak',
    };
  }

  // Priority 3: If close to passing, take more tests
  if (readinessLevel === 'getting-close') {
    return {
      title: "Keep Testing - You're Almost There!",
      description:
        "You're close to being exam-ready. Take a few more practice tests to build confidence.",
      actionLabel: 'Take Practice Test',
      icon: TrendingUp,
      priority: 'practice',
    };
  }

  // Priority 4: If ready, celebrate and suggest real exam
  if (readinessLevel === 'ready') {
    return {
      title: "You're Ready for the Real Exam!",
      description:
        'Your scores show you\'re prepared. Schedule your exam or take one more practice test.',
      actionLabel: 'One More Practice Test',
      icon: CheckCircle,
      priority: 'ready',
    };
  }

  // Default: Continue studying
  return {
    title: 'Continue Your Study Session',
    description:
      'Practice makes perfect. Jump into random questions or focus on specific topics.',
    actionLabel: 'Random Practice',
    icon: Brain,
    priority: 'default',
  };
}
