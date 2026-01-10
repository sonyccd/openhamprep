import { useMemo } from 'react';
import { Target, Zap, TrendingUp, CheckCircle, Brain, LucideIcon } from 'lucide-react';
import {
  ReadinessLevel,
  READINESS_CONFIG,
  getReadinessMessage,
  getReadinessTitle,
} from '@/lib/readinessConfig';
import { useReadinessScore, ReadinessData } from '@/hooks/useReadinessScore';
import { TestType } from '@/types/navigation';

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
  readinessScore: number | null;
  passProbability: number | null;
  config: typeof READINESS_CONFIG[ReadinessLevel];
  recentAvgScore: number;
  totalTests: number;
  passedTests: number;
  nextAction: NextAction;
  isLoading: boolean;
}

/**
 * Options for the new database-backed readiness hook
 */
interface UseTestReadinessOptionsV2 {
  examType: TestType;
  weakQuestionCount: number;
  /** Fallback test results for when DB cache is empty */
  testResults?: TestResult[];
}

/**
 * Legacy options for backwards compatibility
 * @deprecated Use the new options with examType instead
 */
interface UseTestReadinessOptionsLegacy {
  testResults: TestResult[] | undefined;
  weakQuestionCount: number;
}

type UseTestReadinessOptions = UseTestReadinessOptionsV2 | UseTestReadinessOptionsLegacy;

/**
 * Determine readiness level from the numeric readiness score
 */
function scoreToLevel(readinessData: ReadinessData | null): ReadinessLevel {
  if (!readinessData || readinessData.total_attempts < 10) {
    return 'not-started';
  }

  const score = readinessData.readiness_score ?? 0;

  // Map 0-100 score to readiness levels
  // These thresholds align with pass probability from the model
  if (score >= 75) return 'ready';         // ~82%+ pass probability
  if (score >= 60) return 'getting-close'; // ~32-82% pass probability
  return 'needs-work';                     // <32% pass probability
}

/**
 * Calculate progress percentage for the progress bar
 */
function getReadinessProgress(level: ReadinessLevel, score: number | null): number {
  if (level === 'not-started') return 0;

  // Use the actual score if available, scaled to 0-100
  if (score !== null) {
    return Math.min(100, Math.max(0, score));
  }

  // Fallback to fixed values per level
  const progressMap: Record<ReadinessLevel, number> = {
    'not-started': 0,
    'needs-work': 40,
    'getting-close': 75,
    'ready': 100,
  };
  return progressMap[level];
}

/**
 * Hook to get test readiness using the database-backed readiness model.
 *
 * This hook fetches cached readiness data from the database instead of
 * calculating it client-side. The edge function handles all calculations.
 */
export function useTestReadiness(options: UseTestReadinessOptions): TestReadinessResult {
  // Check if using new or legacy options format
  const isV2 = 'examType' in options;
  const examType = isV2 ? options.examType : 'technician';
  const weakQuestionCount = options.weakQuestionCount;
  const testResults = options.testResults;

  // Fetch readiness data from database (new approach)
  const { data: readinessData, isLoading } = useReadinessScore(examType);

  return useMemo(() => {
    // Calculate values from readiness data or fall back to test results
    const totalTests = readinessData?.tests_taken ?? testResults?.length ?? 0;
    const passedTests = readinessData?.tests_passed ?? testResults?.filter((t) => t.passed).length ?? 0;

    // Recent accuracy as percentage (convert from 0-1 to 0-100)
    const recentAvgScore = readinessData?.recent_accuracy
      ? Math.round(readinessData.recent_accuracy * 100)
      : testResults && testResults.length > 0
        ? Math.round(
            testResults.slice(0, 5).reduce((sum, t) => sum + Number(t.percentage), 0) /
              Math.min(testResults.length, 5)
          )
        : 0;

    // Determine readiness level from database score
    const readinessLevel = scoreToLevel(readinessData);
    const readinessMessage = getReadinessMessage(readinessLevel);
    const readinessTitle = getReadinessTitle(readinessLevel);
    const readinessProgress = getReadinessProgress(
      readinessLevel,
      readinessData?.readiness_score ?? null
    );
    const config = READINESS_CONFIG[readinessLevel];

    // Get pass probability from database (already calculated by edge function)
    const passProbability = readinessData?.pass_probability ?? null;
    const readinessScore = readinessData?.readiness_score ?? null;

    // Determine next action based on readiness data
    const recentPassCount = passedTests > 0 ? Math.min(passedTests, 3) : 0; // Approximate
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
      readinessScore,
      passProbability,
      config,
      recentAvgScore,
      totalTests,
      passedTests,
      nextAction,
      isLoading,
    };
  }, [readinessData, testResults, weakQuestionCount, isLoading]);
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
