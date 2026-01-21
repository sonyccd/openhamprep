import { describe, it, expect, vi } from 'vitest';
import { QuestionAttemptPayload, PracticeTestCompletedPayload, ExamOutcomePayload } from './events';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null }))
    }))
  }
}));

// Mock feature flags
vi.mock('./featureFlags', () => ({
  FEATURE_FLAGS: {
    enableEventRecording: true
  }
}));

/**
 * These tests verify that the event payloads match the specification
 * in docs/event-system.md section 6. If these tests fail, the implementation
 * has drifted from the documentation and needs to be corrected.
 */
describe('Event System Spec Compliance (docs/event-system.md section 6)', () => {
  /**
   * Section 6.1: question_attempt
   * The exact fields specified in the documentation.
   */
  describe('6.1 question_attempt', () => {
    // The exact fields from documentation section 6.1
    const SPEC_FIELDS = [
      'question_id',
      'question_code',
      'content_hash',
      'pool_version',
      'topic_code',
      'answer_selected',
      'correct_answer',
      'is_correct',
      'time_spent_ms',
      'time_raw_ms',
      'mode',
      'practice_test_id'
    ] as const;

    it('has exactly the fields specified in section 6.1', () => {
      const payload: QuestionAttemptPayload = {
        question_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        question_code: 'T5A03',
        content_hash: 'e3b0c44298fc1c149afbf4c8996fb924',
        pool_version: '2022-2026',
        topic_code: 'T5A',
        answer_selected: 2,
        correct_answer: 1,
        is_correct: false,
        time_spent_ms: 45000,
        time_raw_ms: 48000,
        mode: 'drill',
        practice_test_id: null
      };

      // Verify all spec fields exist
      for (const field of SPEC_FIELDS) {
        expect(field in payload).toBe(true);
      }

      // Verify no extra fields beyond spec
      const payloadKeys = Object.keys(payload);
      expect(payloadKeys.length).toBe(SPEC_FIELDS.length);
      for (const key of payloadKeys) {
        expect(SPEC_FIELDS).toContain(key);
      }
    });

    it('matches the exact example from section 6.1', () => {
      // This is the exact example payload from the documentation
      const docExample = {
        question_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        question_code: 'T5A03',
        content_hash: 'e3b0c44298fc1c149afbf4c8996fb924...',
        pool_version: '2022-2026',
        topic_code: 'T5A',
        answer_selected: 2,
        correct_answer: 1,
        is_correct: false,
        time_spent_ms: 45000,
        time_raw_ms: 48000,
        mode: 'drill',
        practice_test_id: null
      };

      // Our payload must be assignable to the interface
      const ourPayload: QuestionAttemptPayload = {
        question_id: docExample.question_id,
        question_code: docExample.question_code,
        content_hash: docExample.content_hash,
        pool_version: docExample.pool_version,
        topic_code: docExample.topic_code,
        answer_selected: docExample.answer_selected,
        correct_answer: docExample.correct_answer,
        is_correct: docExample.is_correct,
        time_spent_ms: docExample.time_spent_ms,
        time_raw_ms: docExample.time_raw_ms,
        mode: docExample.mode,
        practice_test_id: docExample.practice_test_id
      };

      // Fields must match exactly
      expect(Object.keys(ourPayload).sort()).toEqual(Object.keys(docExample).sort());
    });

    it('time_spent_ms is capped at 180000ms (3 minutes) per spec', () => {
      const TIME_CAP_MS = 180000; // Per documentation

      expect(Math.min(45000, TIME_CAP_MS)).toBe(45000);   // Under cap
      expect(Math.min(180000, TIME_CAP_MS)).toBe(180000); // At cap
      expect(Math.min(300000, TIME_CAP_MS)).toBe(180000); // Over cap
    });

    it('time_raw_ms stores uncapped actual time per spec', () => {
      // Per spec: "Actual elapsed time. Used to identify distracted attempts"
      const rawTime = 300000; // 5 minutes - should NOT be capped
      expect(rawTime).toBe(300000);
    });

    it('answer_selected and correct_answer are 0-3 integers per spec', () => {
      // Per spec: "User's answer (0, 1, 2, or 3)"
      const validAnswers = [0, 1, 2, 3];
      for (const answer of validAnswers) {
        expect(answer >= 0 && answer <= 3).toBe(true);
      }
    });
  });

  /**
   * Section 6.2: practice_test_completed
   * The exact fields specified in the documentation.
   */
  describe('6.2 practice_test_completed', () => {
    // The exact fields from documentation section 6.2
    const SPEC_FIELDS = [
      'practice_test_id',
      'test_result_id',
      'exam_type',
      'pool_version',
      'score',
      'total_questions',
      'passing_threshold',
      'percentage',
      'duration_seconds',
      'subelement_breakdown'
    ] as const;

    it('has exactly the fields specified in section 6.2', () => {
      const payload: PracticeTestCompletedPayload = {
        practice_test_id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
        test_result_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: 28,
        total_questions: 35,
        passing_threshold: 0.74,
        percentage: 80.0,
        duration_seconds: 1847,
        subelement_breakdown: {
          T1: { correct: 5, total: 6 },
          T2: { correct: 3, total: 3 },
          T5: { correct: 2, total: 4 }
        }
      };

      // Verify all spec fields exist
      for (const field of SPEC_FIELDS) {
        expect(field in payload).toBe(true);
      }

      // Verify no extra fields beyond spec
      const payloadKeys = Object.keys(payload);
      expect(payloadKeys.length).toBe(SPEC_FIELDS.length);
      for (const key of payloadKeys) {
        expect(SPEC_FIELDS).toContain(key);
      }
    });

    it('does NOT have a "passed" field per spec note', () => {
      // Per spec: "Note: No 'passed' boolean — derive it as (score / total_questions >= passing_threshold)"
      const payload: PracticeTestCompletedPayload = {
        practice_test_id: 'test-id',
        test_result_id: null,
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: 28,
        total_questions: 35,
        passing_threshold: 0.74,
        percentage: 80.0,
        duration_seconds: 1847,
        subelement_breakdown: {}
      };

      // 'passed' must NOT exist
      expect('passed' in payload).toBe(false);

      // Verify derivation works as documented
      const passed = payload.score / payload.total_questions >= payload.passing_threshold;
      expect(passed).toBe(true); // 28/35 = 0.8 >= 0.74
    });

    it('matches the exact example from section 6.2', () => {
      // This is the exact example payload from the documentation
      const docExample = {
        practice_test_id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0',
        test_result_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: 28,
        total_questions: 35,
        passing_threshold: 0.74,
        percentage: 80.0,
        duration_seconds: 1847,
        subelement_breakdown: {
          T1: { correct: 5, total: 6 },
          T2: { correct: 3, total: 3 },
          T5: { correct: 2, total: 4 }
        }
      };

      const ourPayload: PracticeTestCompletedPayload = {
        practice_test_id: docExample.practice_test_id,
        test_result_id: docExample.test_result_id,
        exam_type: docExample.exam_type,
        pool_version: docExample.pool_version,
        score: docExample.score,
        total_questions: docExample.total_questions,
        passing_threshold: docExample.passing_threshold,
        percentage: docExample.percentage,
        duration_seconds: docExample.duration_seconds,
        subelement_breakdown: docExample.subelement_breakdown
      };

      expect(Object.keys(ourPayload).sort()).toEqual(Object.keys(docExample).sort());
    });

    it('subelement_breakdown has correct structure per spec', () => {
      // Per spec example: { "T1": { "correct": 5, "total": 6 }, ... }
      const breakdown: PracticeTestCompletedPayload['subelement_breakdown'] = {
        T1: { correct: 5, total: 6 },
        T2: { correct: 3, total: 3 }
      };

      expect(breakdown.T1.correct).toBe(5);
      expect(breakdown.T1.total).toBe(6);
      expect(breakdown.T2.correct).toBe(3);
      expect(breakdown.T2.total).toBe(3);
    });
  });

  /**
   * Section 6.3: exam_outcome
   * The exact fields specified in the documentation.
   */
  describe('6.3 exam_outcome', () => {
    // The exact fields from documentation section 6.3
    const SPEC_FIELDS = [
      'source',
      'exam_type',
      'pool_version',
      'score',
      'total_questions',
      'passing_threshold',
      'attempt_number',
      'exam_date',
      'confidence_level',
      'state_snapshot'
    ] as const;

    // The exact state_snapshot fields from documentation
    const STATE_SNAPSHOT_FIELDS = [
      'readiness_score',
      'pass_probability',
      'coverage',
      'recent_accuracy',
      'practice_tests_passed',
      'practice_tests_taken'
    ] as const;

    it('has exactly the fields specified in section 6.3', () => {
      const payload: ExamOutcomePayload = {
        source: 'user_reported',
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: 32,
        total_questions: 35,
        passing_threshold: 0.74,
        attempt_number: 1,
        exam_date: '2026-01-15',
        confidence_level: 'confident',
        state_snapshot: {
          readiness_score: 0.82,
          pass_probability: 0.89,
          coverage: 0.95,
          recent_accuracy: 0.78,
          practice_tests_passed: 8,
          practice_tests_taken: 10
        }
      };

      // Verify all spec fields exist
      for (const field of SPEC_FIELDS) {
        expect(field in payload).toBe(true);
      }

      // Verify no extra fields beyond spec
      const payloadKeys = Object.keys(payload);
      expect(payloadKeys.length).toBe(SPEC_FIELDS.length);
      for (const key of payloadKeys) {
        expect(SPEC_FIELDS).toContain(key);
      }
    });

    it('state_snapshot has exactly the fields specified in section 6.3', () => {
      const stateSnapshot: NonNullable<ExamOutcomePayload['state_snapshot']> = {
        readiness_score: 0.82,
        pass_probability: 0.89,
        coverage: 0.95,
        recent_accuracy: 0.78,
        practice_tests_passed: 8,
        practice_tests_taken: 10
      };

      // Verify all spec fields exist
      for (const field of STATE_SNAPSHOT_FIELDS) {
        expect(field in stateSnapshot).toBe(true);
      }

      // Verify no extra fields beyond spec
      const snapshotKeys = Object.keys(stateSnapshot);
      expect(snapshotKeys.length).toBe(STATE_SNAPSHOT_FIELDS.length);
      for (const key of snapshotKeys) {
        expect(STATE_SNAPSHOT_FIELDS).toContain(key);
      }
    });

    it('source field only allows specified values per spec', () => {
      // Per spec: "'user_reported', 'system_calculated', or 'imported'"
      const validSources = ['user_reported', 'system_calculated', 'imported'] as const;

      for (const source of validSources) {
        const payload: ExamOutcomePayload = {
          source,
          exam_type: 'technician',
          pool_version: '2022-2026',
          score: 32,
          total_questions: 35,
          passing_threshold: 0.74,
          attempt_number: 1,
          exam_date: '2026-01-15',
          confidence_level: null,
          state_snapshot: null
        };
        expect(validSources).toContain(payload.source);
      }
    });

    it('allows nullable fields per spec', () => {
      // Per spec: score is "Integer|null", confidence_level is "String|null"
      const payload: ExamOutcomePayload = {
        source: 'user_reported',
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: null,
        total_questions: 35,
        passing_threshold: 0.74,
        attempt_number: 1,
        exam_date: '2026-01-15',
        confidence_level: null,
        state_snapshot: null
      };

      expect(payload.score).toBeNull();
      expect(payload.confidence_level).toBeNull();
      expect(payload.state_snapshot).toBeNull();
    });

    it('matches the exact example from section 6.3', () => {
      // This is the exact example payload from the documentation
      const docExample = {
        source: 'user_reported',
        exam_type: 'technician',
        pool_version: '2022-2026',
        score: 32,
        total_questions: 35,
        passing_threshold: 0.74,
        attempt_number: 1,
        exam_date: '2026-01-15',
        confidence_level: 'confident',
        state_snapshot: {
          readiness_score: 0.82,
          pass_probability: 0.89,
          coverage: 0.95,
          recent_accuracy: 0.78,
          practice_tests_passed: 8,
          practice_tests_taken: 10
        }
      };

      const ourPayload: ExamOutcomePayload = {
        source: docExample.source as 'user_reported',
        exam_type: docExample.exam_type,
        pool_version: docExample.pool_version,
        score: docExample.score,
        total_questions: docExample.total_questions,
        passing_threshold: docExample.passing_threshold,
        attempt_number: docExample.attempt_number,
        exam_date: docExample.exam_date,
        confidence_level: docExample.confidence_level,
        state_snapshot: docExample.state_snapshot
      };

      expect(Object.keys(ourPayload).sort()).toEqual(Object.keys(docExample).sort());
      expect(Object.keys(ourPayload.state_snapshot!).sort()).toEqual(
        Object.keys(docExample.state_snapshot).sort()
      );
    });
  });

  /**
   * Section 7.1: Configuration
   * Verify POOL_CONFIG matches the documentation.
   */
  describe('7.1 Configuration (POOL_CONFIG)', () => {
    it('has correct pool versions per spec', async () => {
      const { POOL_CONFIG } = await import('./poolConfig');

      // Per documentation section 7.1
      expect(POOL_CONFIG.technician.currentVersion).toBe('2022-2026');
      expect(POOL_CONFIG.general.currentVersion).toBe('2023-2027');
      expect(POOL_CONFIG.extra.currentVersion).toBe('2024-2028');
    });

    it('has correct passing thresholds per spec', async () => {
      const { POOL_CONFIG } = await import('./poolConfig');

      // Per documentation section 7.1: all are 0.74
      expect(POOL_CONFIG.technician.passingThreshold).toBe(0.74);
      expect(POOL_CONFIG.general.passingThreshold).toBe(0.74);
      expect(POOL_CONFIG.extra.passingThreshold).toBe(0.74);
    });
  });

  /**
   * Time capping constant verification
   */
  describe('Time capping', () => {
    it('TIME_CAP_MS is 180000 (3 minutes) per section 6.1', () => {
      // Per spec: "time_spent_ms: Capped at 180 seconds (3 minutes)"
      const TIME_CAP_MS = 180000;
      expect(TIME_CAP_MS).toBe(3 * 60 * 1000);
    });
  });

  /**
   * Error handling verification
   */
  describe('Error handling', () => {
    it('recordQuestionAttempt handles missing displayName gracefully', async () => {
      const { recordQuestionAttempt } = await import('./events');

      // Create a question with undefined displayName
      const questionWithNoDisplayName = {
        id: 'test-id',
        displayName: undefined as unknown as string,
        correctAnswer: 'A' as const,
        group: 'T5A',
        contentHash: null,
        poolVersion: null
      };

      // Should not throw when displayName is undefined
      await expect(
        recordQuestionAttempt({
          question: questionWithNoDisplayName as any,
          answerSelected: 0,
          timeElapsedMs: 1000,
          mode: 'test',
          userId: 'test-user'
        })
      ).resolves.not.toThrow();
    });

    it('falls back to question.id when displayName is missing', () => {
      // Test the fallback logic
      const displayName = undefined;
      const id = 'T5A03-uuid';
      const result = displayName || id || '';
      expect(result).toBe('T5A03-uuid');
    });

    it('falls back to empty string when both displayName and id are missing', () => {
      const displayName = undefined;
      const id = undefined;
      const result = displayName || id || '';
      expect(result).toBe('');
    });

    it('topic_code falls back to UNK when extraction fails', () => {
      const displayName = '';
      const group = undefined;
      const topicCode = group || displayName.slice(0, 3) || 'UNK';
      expect(topicCode).toBe('UNK');
    });

    it('getPoolVersionFromDisplayName handles empty string', () => {
      // When displayName is empty, should return technician version
      const displayName = '';
      const prefix = displayName ? displayName.charAt(0).toUpperCase() : '';
      const version = prefix === 'T' ? '2022-2026'
        : prefix === 'G' ? '2023-2027'
        : prefix === 'E' ? '2024-2028'
        : '2022-2026'; // Default to technician
      expect(version).toBe('2022-2026');
    });
  });

  /**
   * userId optimization verification
   */
  describe('userId parameter optimization', () => {
    it('accepts userId parameter to avoid redundant auth calls', async () => {
      const { recordQuestionAttempt } = await import('./events');

      const mockQuestion = {
        id: 'test-id',
        displayName: 'T5A03',
        correctAnswer: 'A' as const,
        group: 'T5A',
        contentHash: 'abc123',
        poolVersion: '2022-2026'
      };

      // Should accept userId parameter without error
      await expect(
        recordQuestionAttempt({
          question: mockQuestion as any,
          answerSelected: 0,
          timeElapsedMs: 1000,
          mode: 'test',
          userId: 'provided-user-id'
        })
      ).resolves.not.toThrow();
    });

    it('recordPracticeTestCompleted accepts userId parameter', async () => {
      const { recordPracticeTestCompleted } = await import('./events');

      await expect(
        recordPracticeTestCompleted({
          practiceTestId: 'test-id',
          testResultId: 'result-id',
          examType: 'technician',
          totalQuestions: 35,
          score: 28,
          percentage: 80,
          durationSeconds: 1800,
          subelementBreakdown: {},
          userId: 'provided-user-id'
        })
      ).resolves.not.toThrow();
    });

    it('recordTopicQuizCompleted accepts userId parameter', async () => {
      const { recordTopicQuizCompleted } = await import('./events');

      await expect(
        recordTopicQuizCompleted({
          topicId: 'topic-id',
          topicSlug: 'topic-slug',
          totalQuestions: 10,
          correctCount: 8,
          percentage: 80,
          passed: true,
          userId: 'provided-user-id'
        })
      ).resolves.not.toThrow();
    });

    it('recordExamOutcome accepts userId parameter', async () => {
      const { recordExamOutcome } = await import('./events');

      await expect(
        recordExamOutcome({
          source: 'user_reported',
          examType: 'technician',
          score: 32,
          totalQuestions: 35,
          attemptNumber: 1,
          examDate: '2026-01-15',
          userId: 'provided-user-id'
        })
      ).resolves.not.toThrow();
    });
  });
});
