/**
 * Service Layer Exports
 *
 * Central export point for all services and utilities.
 * Import from '@/services' for cleaner imports.
 *
 * @example
 * ```typescript
 * import { queryKeys, success, failure, ServiceBase } from '@/services';
 * ```
 */

// Query keys registry
export { queryKeys } from './queryKeys';
export type { QueryKeys } from './queryKeys';

// Service result types and helpers
export {
  success,
  failure,
  isSuccess,
  isFailure,
  unwrapOrThrow,
  ServiceLayerError,
} from './types';

export type {
  ServiceResult,
  ServiceError,
  ServiceErrorCode,
} from './types';

// Base class for services
export { ServiceBase } from './shared/serviceBase';

// Domain services
export { glossaryService } from './glossary/glossaryService';
export type { GlossaryTerm } from './glossary/glossaryService';

export { bookmarkService } from './bookmarks/bookmarkService';
export type { BookmarkRow } from './bookmarks/bookmarkService';

export { questionService } from './questions/questionService';
export type { Question, LinkData, QuestionTopic } from './questions/questionService';

export { readinessService } from './readiness/readinessService';
export type { ReadinessData, SubelementMetric, ReadinessSnapshot } from './readiness/readinessService';

export { progressService } from './progress/progressService';
export type { TestResultRow, AttemptRecord } from './progress/progressService';

export { streakService } from './streak/streakService';
export type { RawStreakInfo, IncrementActivityOptions } from './streak/streakService';

export { feedbackService } from './feedback/feedbackService';
export type { FeedbackRecord } from './feedback/feedbackService';

export { searchService } from './search/searchService';
export type { SearchContentResponse, SearchContentParams } from './search/searchService';

export { examSessionService } from './examSession/examSessionService';
export type {
  ExamSession, UserTargetExam, ExamAttempt, LicenseType, ExamOutcome,
  PaginatedSessions, SaveTargetParams, RecordAttemptParams, UpdateOutcomeParams,
  BulkImportResult, GeocodeSessions,
} from './examSession/examSessionService';

export { weeklyGoalsService } from './weeklyGoals/weeklyGoalsService';
export type { WeeklyGoals } from './weeklyGoals/weeklyGoalsService';

export { dashboardDataService } from './dashboard/dashboardDataService';
export type { AttemptWithDisplayName, ProfileStats, FullProfile } from './dashboard/dashboardDataService';
