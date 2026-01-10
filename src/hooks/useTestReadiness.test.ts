import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTestReadiness } from './useTestReadiness';
import type { ReadinessData } from './useReadinessScore';

// Mock the useReadinessScore hook
const mockReadinessData = vi.fn<[], { data: ReadinessData | null; isLoading: boolean }>();

vi.mock('@/hooks/useReadinessScore', () => ({
  useReadinessScore: () => mockReadinessData(),
  recalculateReadiness: vi.fn(),
}));

describe('useTestReadiness', () => {
  const createTestResults = (
    tests: Array<{ percentage: number; passed: boolean }>
  ) =>
    tests.map((t, i) => ({
      id: `test-${i}`,
      percentage: t.percentage,
      passed: t.passed,
      completed_at: new Date().toISOString(),
    }));

  const createReadinessData = (overrides: Partial<ReadinessData> = {}): ReadinessData => ({
    id: 'test-id',
    user_id: 'user-123',
    exam_type: 'technician',
    recent_accuracy: 0.8,
    overall_accuracy: 0.75,
    coverage: 0.6,
    mastery: 0.5,
    tests_passed: 3,
    tests_taken: 5,
    last_study_at: new Date().toISOString(),
    readiness_score: 70,
    pass_probability: 0.65,
    expected_exam_score: 28,
    subelement_metrics: {},
    total_attempts: 50,
    unique_questions_seen: 100,
    config_version: '1.0',
    calculated_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to no readiness data (legacy mode)
    mockReadinessData.mockReturnValue({ data: null, isLoading: false });
  });

  describe('Not Started State (Legacy Mode)', () => {
    it('returns not-started when no tests taken and no DB data', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: [],
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessLevel).toBe('not-started');
      expect(result.current.totalTests).toBe(0);
      expect(result.current.passedTests).toBe(0);
      expect(result.current.recentAvgScore).toBe(0);
    });

    it('returns not-started when testResults is undefined', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: undefined,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessLevel).toBe('not-started');
    });

    it('returns correct message for not-started', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: [],
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessMessage).toBe(
        'Take some practice tests to see your readiness'
      );
      expect(result.current.readinessTitle).toBe('Test Readiness Unknown');
    });

    it('returns 0 progress for not-started', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: [],
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessProgress).toBe(0);
    });
  });

  describe('Not Started State (insufficient DB data)', () => {
    it('returns not-started when total_attempts < 10', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ total_attempts: 5, readiness_score: 60 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessLevel).toBe('not-started');
    });
  });

  describe('Needs Work State (DB-backed)', () => {
    it('returns needs-work when readiness score < 60', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 45,
          total_attempts: 50,
          pass_probability: 0.15
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessLevel).toBe('needs-work');
    });

    it('returns correct message for needs-work', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 50, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessMessage).toBe('Keep practicing to improve your scores');
      expect(result.current.readinessTitle).toBe('Not Ready Yet');
    });

    it('returns score-based progress for needs-work', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 45, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessProgress).toBe(45);
    });
  });

  describe('Getting Close State (DB-backed)', () => {
    it('returns getting-close when score is 60-74', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 68,
          total_attempts: 50,
          pass_probability: 0.55
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessLevel).toBe('getting-close');
    });

    it('returns correct message for getting-close', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 70, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessMessage).toBe(
        "Almost there! A few more passing scores and you'll be ready"
      );
      expect(result.current.readinessTitle).toBe('Almost Ready!');
    });

    it('returns score-based progress for getting-close', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 70, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessProgress).toBe(70);
    });
  });

  describe('Ready State (DB-backed)', () => {
    it('returns ready when score >= 75', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 85,
          total_attempts: 100,
          pass_probability: 0.92
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 2,
        })
      );

      expect(result.current.readinessLevel).toBe('ready');
    });

    it('returns ready at threshold score of 75', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 75, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessLevel).toBe('ready');
    });

    it('returns correct message for ready', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 85, total_attempts: 100 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessMessage).toBe("You're ready to take the real exam!");
      expect(result.current.readinessTitle).toBe('Ready to Pass!');
    });

    it('returns score-based progress for ready (capped at 100)', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 95, total_attempts: 100 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessProgress).toBe(95);
    });
  });

  describe('Statistics Calculation', () => {
    it('uses DB values for stats when available', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          tests_taken: 10,
          tests_passed: 7,
          recent_accuracy: 0.85,
          total_attempts: 50
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.totalTests).toBe(10);
      expect(result.current.passedTests).toBe(7);
      expect(result.current.recentAvgScore).toBe(85); // 0.85 * 100
    });

    it('falls back to testResults for stats when no DB data', () => {
      const testResults = createTestResults([
        { percentage: 80, passed: true },
        { percentage: 70, passed: false },
        { percentage: 75, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.totalTests).toBe(3);
      expect(result.current.passedTests).toBe(2);
    });

    it('calculates recent average score from last 5 test results', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 80, passed: true },
        { percentage: 70, passed: false },
        { percentage: 80, passed: true },
        { percentage: 80, passed: true },
        { percentage: 50, passed: false }, // This should be ignored (6th test)
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      // Average of 90, 80, 70, 80, 80 = 80
      expect(result.current.recentAvgScore).toBe(80);
    });
  });

  describe('Pass Probability and Readiness Score', () => {
    it('exposes pass probability from DB', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          pass_probability: 0.78,
          readiness_score: 72,
          total_attempts: 50
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.passProbability).toBe(0.78);
      expect(result.current.readinessScore).toBe(72);
    });

    it('returns null for probability when no DB data', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: [],
          weakQuestionCount: 0,
        })
      );

      expect(result.current.passProbability).toBeNull();
      expect(result.current.readinessScore).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('passes through loading state from useReadinessScore', () => {
      mockReadinessData.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Next Action', () => {
    it('suggests taking first test when no tests', () => {
      const { result } = renderHook(() =>
        useTestReadiness({
          testResults: [],
          weakQuestionCount: 0,
        })
      );

      expect(result.current.nextAction.priority).toBe('start');
      expect(result.current.nextAction.title).toBe('Take Your First Practice Test');
    });

    it('suggests reviewing weak questions when failing with many weak questions', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          tests_taken: 2,
          tests_passed: 0,
          readiness_score: 40,
          total_attempts: 50
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 10,
        })
      );

      expect(result.current.nextAction.priority).toBe('weak');
      expect(result.current.nextAction.title).toBe('Review Your Weak Areas');
    });

    it('suggests more tests when getting close', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 68,
          tests_taken: 5,
          tests_passed: 3,
          total_attempts: 50
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 3,
        })
      );

      expect(result.current.nextAction.priority).toBe('practice');
    });

    it('celebrates when ready', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 85,
          tests_taken: 10,
          tests_passed: 8,
          total_attempts: 100
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 0,
        })
      );

      expect(result.current.nextAction.priority).toBe('ready');
      expect(result.current.nextAction.title).toBe("You're Ready for the Real Exam!");
    });

    it('suggests random practice as default for needs-work with few weak questions', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({
          readiness_score: 50,
          tests_taken: 5,
          tests_passed: 2,
          total_attempts: 50
        }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({
          examType: 'technician',
          weakQuestionCount: 3,
        })
      );

      expect(result.current.nextAction.priority).toBe('default');
      expect(result.current.nextAction.title).toBe('Continue Your Study Session');
    });
  });

  describe('Score Threshold Boundaries', () => {
    it('score 59 is needs-work', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 59, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({ examType: 'technician', weakQuestionCount: 0 })
      );

      expect(result.current.readinessLevel).toBe('needs-work');
    });

    it('score 60 is getting-close', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 60, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({ examType: 'technician', weakQuestionCount: 0 })
      );

      expect(result.current.readinessLevel).toBe('getting-close');
    });

    it('score 74 is getting-close', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 74, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({ examType: 'technician', weakQuestionCount: 0 })
      );

      expect(result.current.readinessLevel).toBe('getting-close');
    });

    it('score 75 is ready', () => {
      mockReadinessData.mockReturnValue({
        data: createReadinessData({ readiness_score: 75, total_attempts: 50 }),
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useTestReadiness({ examType: 'technician', weakQuestionCount: 0 })
      );

      expect(result.current.readinessLevel).toBe('ready');
    });
  });
});
