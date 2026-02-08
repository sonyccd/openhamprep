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
export type { ReadinessData, SubelementMetric } from './readiness/readinessService';
