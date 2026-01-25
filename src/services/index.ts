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
