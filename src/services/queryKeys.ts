/**
 * Centralized Query Keys Registry
 *
 * All TanStack Query cache keys are defined here in a type-safe manner.
 * This prevents typos, enables consistent cache invalidation, and makes
 * it easy to find all places that depend on a particular cache key.
 *
 * Usage:
 * ```typescript
 * import { queryKeys } from '@/services/queryKeys';
 *
 * // In a hook
 * useQuery({
 *   queryKey: queryKeys.questions.all('technician'),
 *   queryFn: ...
 * });
 *
 * // For cache invalidation
 * queryClient.invalidateQueries({ queryKey: queryKeys.questions.all() });
 * ```
 *
 * Naming conventions:
 * - `.all(params?)` - List/collection queries (may be filtered)
 * - `.detail(id)` - Single item by ID
 * - `.byX(param)` - Filtered subset
 */

import { TestType } from '@/types/navigation';
import { AlertStatus } from '@/hooks/useAlerts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LicenseType = 'technician' | 'general' | 'extra';

interface ExamSessionFilters {
  zip?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  walkInsOnly?: boolean;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const queryKeys = {
  // ---------------------------------------------------------------------------
  // Questions Domain
  // ---------------------------------------------------------------------------
  questions: {
    /** All questions queries - use for broad invalidation */
    root: ['questions'] as const,

    /** Questions list (optionally filtered by test type) */
    all: (testType?: TestType) =>
      testType ? ['questions', testType] as const : ['questions'] as const,

    /** Single question by ID or display name */
    detail: (questionId: string) => ['question', questionId] as const,

    /** Multiple questions by their UUIDs */
    byIds: (ids: string[]) => ['questions-by-ids', [...ids].sort()] as const,

    /** Questions filtered by license type (for admin linking) */
    forLicense: (licenseType: LicenseType | undefined) =>
      ['questions-for-license', licenseType] as const,

    /** Admin questions (includes all fields, edit history) */
    admin: (testType?: TestType) =>
      testType
        ? ['admin-questions', testType] as const
        : ['admin-questions'] as const,

    /** Admin questions full (all test types) */
    adminFull: () => ['admin-questions-full'] as const,
  },

  // ---------------------------------------------------------------------------
  // Bookmarks Domain
  // ---------------------------------------------------------------------------
  bookmarks: {
    /** All bookmarks for a user */
    all: (userId: string) => ['bookmarks', userId] as const,
  },

  // ---------------------------------------------------------------------------
  // Progress Domain
  // ---------------------------------------------------------------------------
  progress: {
    /** Root key for all progress queries */
    root: ['progress'] as const,

    /** Daily streak information */
    streak: (userId: string) => ['daily-streak', userId] as const,

    /** Question attempts for a user */
    attempts: (userId: string) => ['question-attempts', userId] as const,

    /** Test results for a user */
    testResults: (userId: string) => ['test-results', userId] as const,

    /** Profile stats (aggregate counts) */
    profileStats: (userId: string) => ['profile-stats', userId] as const,

    /** Weekly study goals */
    weeklyGoals: (userId: string) => ['weekly-goals', userId] as const,
  },

  // ---------------------------------------------------------------------------
  // Readiness Domain
  // ---------------------------------------------------------------------------
  readiness: {
    /** Readiness score cache for user + exam type */
    score: (userId: string, examType: TestType) =>
      ['readiness', userId, examType] as const,

    /** Readiness score - for invalidation by user only */
    byUser: (userId: string) => ['readiness', userId] as const,

    /** Historical readiness snapshots */
    snapshots: (userId: string, examType: TestType, days: number) =>
      ['readiness-snapshots', userId, examType, days] as const,

    /** Snapshots - for invalidation by user only */
    snapshotsByUser: (userId: string) => ['readiness-snapshots', userId] as const,
  },

  // ---------------------------------------------------------------------------
  // Topics Domain
  // ---------------------------------------------------------------------------
  topics: {
    /** All topics (optionally filtered by test type) */
    all: (testType?: TestType) =>
      testType ? ['topics', testType] as const : ['topics'] as const,

    /** Single topic by slug */
    detail: (slug: string) => ['topic', slug] as const,

    /** Topic content from storage (deprecated) */
    content: (contentPath: string | null | undefined) =>
      ['topic-content', contentPath] as const,

    /** User's topic progress (all topics) */
    progress: () => ['topic-progress'] as const,

    /** Questions linked to a topic */
    questions: (topicId: string) => ['topic-questions', topicId] as const,

    /** Admin topics (includes unpublished) */
    admin: () => ['admin-topics'] as const,
  },

  // ---------------------------------------------------------------------------
  // Lessons Domain
  // ---------------------------------------------------------------------------
  lessons: {
    /** All lessons (optionally filtered by test type) */
    all: (testType?: TestType) =>
      testType ? ['lessons', testType] as const : ['lessons'] as const,

    /** Single lesson by slug */
    detail: (slug: string) => ['lesson', slug] as const,

    /** User's lesson progress (all lessons) */
    progress: () => ['lesson-progress'] as const,

    /** Admin lessons (includes unpublished) */
    admin: () => ['admin-lessons'] as const,
  },

  // ---------------------------------------------------------------------------
  // Glossary Domain
  // ---------------------------------------------------------------------------
  glossary: {
    /** All glossary terms */
    terms: () => ['glossary-terms'] as const,
  },

  // ---------------------------------------------------------------------------
  // Exam Sessions Domain
  // ---------------------------------------------------------------------------
  examSessions: {
    /** All exam sessions (with optional filters) */
    all: (filters?: ExamSessionFilters) =>
      filters ? ['exam-sessions', filters] as const : ['exam-sessions'] as const,

    /** Total count of exam sessions */
    count: () => ['exam-sessions-count'] as const,

    /** Last updated timestamp for sessions */
    lastUpdated: () => ['exam-sessions-last-updated'] as const,

    /** Sessions needing geocoding (missing coordinates) */
    needingGeocode: (includeAll = false) =>
      ['sessions-needing-geocode', { includeAll }] as const,

    /** Count of sessions needing geocoding */
    needingGeocodeCount: () => ['sessions-needing-geocode-count'] as const,
  },

  // ---------------------------------------------------------------------------
  // User Target Exam Domain
  // ---------------------------------------------------------------------------
  targetExam: {
    /** User's target exam date */
    byUser: (userId: string) => ['user-target-exam', userId] as const,

    /** Root key for invalidation */
    root: () => ['user-target-exam'] as const,
  },

  // ---------------------------------------------------------------------------
  // Exam Attempts Domain
  // ---------------------------------------------------------------------------
  examAttempts: {
    /** User's exam attempt history */
    byUser: (userId: string) => ['exam-attempts', userId] as const,

    /** Root key for invalidation */
    root: () => ['exam-attempts'] as const,
  },

  // ---------------------------------------------------------------------------
  // ARRL Chapters Domain
  // ---------------------------------------------------------------------------
  arrlChapters: {
    /** All chapters (optionally by license type) */
    all: (licenseType?: LicenseType) =>
      licenseType
        ? ['arrl-chapters', licenseType] as const
        : ['arrl-chapters'] as const,

    /** Chapters with question counts */
    withCounts: (licenseType?: LicenseType) =>
      licenseType
        ? ['arrl-chapters-with-counts', licenseType] as const
        : ['arrl-chapters-with-counts'] as const,

    /** Single chapter by ID */
    detail: (id: string) => ['arrl-chapter', id] as const,

    /** Questions linked to a chapter */
    questions: (chapterId: string) => ['chapter-questions', chapterId] as const,
  },

  // ---------------------------------------------------------------------------
  // Auth/Profile Domain
  // ---------------------------------------------------------------------------
  auth: {
    /** User's role (admin check) */
    role: (userId: string) => ['user-role', userId] as const,
  },

  // ---------------------------------------------------------------------------
  // Alerts Domain
  // ---------------------------------------------------------------------------
  alerts: {
    /** All alerts (optionally filtered by status) */
    all: (status?: AlertStatus | 'active') =>
      status ? ['alerts', status] as const : ['alerts'] as const,

    /** Count of unacknowledged alerts */
    unacknowledgedCount: () => ['alerts', 'unacknowledged-count'] as const,

    /** Counts by status (for dashboard) */
    counts: () => ['alerts', 'counts'] as const,

    /** Alert rules configuration */
    rules: () => ['alert-rules'] as const,

    /** System monitor runs */
    monitorRuns: (limit: number) => ['monitor-runs', limit] as const,
  },

  // ---------------------------------------------------------------------------
  // Explanation Feedback Domain
  // ---------------------------------------------------------------------------
  feedback: {
    /** User's feedback for a specific question */
    forQuestion: (questionId: string, userId: string) =>
      ['explanation-feedback', questionId, userId] as const,

    /** Admin aggregated feedback stats */
    adminStats: () => ['admin-explanation-feedback'] as const,
  },

  // ---------------------------------------------------------------------------
  // Ham Radio Tools Domain
  // ---------------------------------------------------------------------------
  hamRadioTools: {
    /** All tool categories */
    categories: () => ['ham-radio-tool-categories'] as const,

    /** All tools (optionally by category slug) */
    all: (categorySlug?: string) =>
      categorySlug
        ? ['ham-radio-tools', categorySlug] as const
        : ['ham-radio-tools'] as const,

    /** Admin tools (includes unpublished) */
    admin: () => ['admin-ham-radio-tools'] as const,
  },

  // ---------------------------------------------------------------------------
  // Discourse Sync Domain
  // ---------------------------------------------------------------------------
  discourse: {
    /** Sync overview stats */
    overview: () => ['discourse-sync-overview'] as const,
  },

  // ---------------------------------------------------------------------------
  // Geocoding/Mapbox Domain
  // ---------------------------------------------------------------------------
  geocoding: {
    /** Current Mapbox usage stats */
    usage: () => ['mapbox-usage'] as const,
  },

  // ---------------------------------------------------------------------------
  // Admin Stats Domain
  // ---------------------------------------------------------------------------
  adminStats: {
    /** Question count stats */
    questions: () => ['admin-stats-questions'] as const,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QueryKeys = typeof queryKeys;
