import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTestReadiness } from './useTestReadiness';

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

  describe('Not Started State', () => {
    it('returns not-started when no tests taken', () => {
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

  describe('Needs Work State', () => {
    it('returns needs-work when scores are below 74%', () => {
      const testResults = createTestResults([
        { percentage: 60, passed: false },
        { percentage: 65, passed: false },
        { percentage: 70, passed: false },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessLevel).toBe('needs-work');
    });

    it('returns correct message for needs-work', () => {
      const testResults = createTestResults([
        { percentage: 60, passed: false },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessMessage).toBe('Keep practicing to improve your scores');
      expect(result.current.readinessTitle).toBe('Not Ready Yet');
    });

    it('returns 40 progress for needs-work', () => {
      const testResults = createTestResults([
        { percentage: 60, passed: false },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 10,
        })
      );

      expect(result.current.readinessProgress).toBe(40);
    });
  });

  describe('Getting Close State', () => {
    it('returns getting-close when average is 74-84% with at least one pass', () => {
      const testResults = createTestResults([
        { percentage: 78, passed: true },
        { percentage: 76, passed: true },
        { percentage: 72, passed: false },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessLevel).toBe('getting-close');
    });

    it('returns correct message for getting-close', () => {
      const testResults = createTestResults([
        { percentage: 80, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessMessage).toBe(
        "Almost there! A few more passing scores and you'll be ready"
      );
      expect(result.current.readinessTitle).toBe('Almost Ready!');
    });

    it('returns 75 progress for getting-close', () => {
      const testResults = createTestResults([
        { percentage: 80, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 5,
        })
      );

      expect(result.current.readinessProgress).toBe(75);
    });
  });

  describe('Ready State', () => {
    it('returns ready when average >= 85% with 3+ passes in last 5', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 88, passed: true },
        { percentage: 86, passed: true },
        { percentage: 85, passed: true },
        { percentage: 82, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 2,
        })
      );

      expect(result.current.readinessLevel).toBe('ready');
    });

    it('returns ready with fewer tests if all pass with high scores', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 88, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessLevel).toBe('ready');
    });

    it('returns correct message for ready', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 88, passed: true },
        { percentage: 86, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessMessage).toBe("You're ready to take the real exam!");
      expect(result.current.readinessTitle).toBe('Ready to Pass!');
    });

    it('returns 100 progress for ready', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 88, passed: true },
        { percentage: 86, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.readinessProgress).toBe(100);
    });
  });

  describe('Statistics Calculation', () => {
    it('calculates total tests correctly', () => {
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
    });

    it('calculates passed tests correctly', () => {
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

      expect(result.current.passedTests).toBe(2);
    });

    it('calculates recent average score from last 5 tests', () => {
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
      const testResults = createTestResults([
        { percentage: 65, passed: false },
        { percentage: 60, passed: false },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 10,
        })
      );

      expect(result.current.nextAction.priority).toBe('weak');
      expect(result.current.nextAction.title).toBe('Review Your Weak Areas');
    });

    it('suggests more tests when getting close', () => {
      const testResults = createTestResults([
        { percentage: 80, passed: true },
        { percentage: 78, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 3,
        })
      );

      expect(result.current.nextAction.priority).toBe('practice');
    });

    it('celebrates when ready', () => {
      const testResults = createTestResults([
        { percentage: 90, passed: true },
        { percentage: 88, passed: true },
        { percentage: 86, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 0,
        })
      );

      expect(result.current.nextAction.priority).toBe('ready');
      expect(result.current.nextAction.title).toBe("You're Ready for the Real Exam!");
    });

    it('suggests random practice as default', () => {
      const testResults = createTestResults([
        { percentage: 70, passed: false },
        { percentage: 72, passed: false },
        { percentage: 75, passed: true },
      ]);

      const { result } = renderHook(() =>
        useTestReadiness({
          testResults,
          weakQuestionCount: 3,
        })
      );

      expect(result.current.nextAction.priority).toBe('default');
      expect(result.current.nextAction.title).toBe('Continue Your Study Session');
    });
  });
});
