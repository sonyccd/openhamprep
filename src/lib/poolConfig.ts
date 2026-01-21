/**
 * Question pool configuration for each exam type.
 *
 * This configuration tracks the current pool version and passing thresholds
 * for each amateur radio license exam. Pool versions follow the pattern
 * YYYY-YYYY matching the FCC's question pool effective dates.
 */

export interface PoolConfig {
  currentVersion: string;
  passingThreshold: number;
  questionCount: number;
  effectiveDate: string;
  expirationDate: string;
}

/**
 * Current pool configuration by exam type.
 *
 * Pool versions are updated every 4 years on a staggered schedule:
 * - Technician: Updated July 1, 2022 (valid through June 30, 2026)
 * - General: Updated July 1, 2023 (valid through June 30, 2027)
 * - Extra: Updated July 1, 2024 (valid through June 30, 2028)
 */
export const POOL_CONFIG = {
  technician: {
    currentVersion: '2022-2026',
    passingThreshold: 0.74, // 26/35 = 74.3%
    questionCount: 411,
    effectiveDate: '2022-07-01',
    expirationDate: '2026-06-30'
  },
  general: {
    currentVersion: '2023-2027',
    passingThreshold: 0.74, // 26/35 = 74.3%
    questionCount: 456,
    effectiveDate: '2023-07-01',
    expirationDate: '2027-06-30'
  },
  extra: {
    currentVersion: '2024-2028',
    passingThreshold: 0.74, // 37/50 = 74%
    questionCount: 622,
    effectiveDate: '2024-07-01',
    expirationDate: '2028-06-30'
  }
} as const;

export type ExamType = keyof typeof POOL_CONFIG;

/**
 * Get the current pool version for an exam type.
 *
 * @param examType - The exam type (technician, general, extra)
 * @returns The current pool version string (e.g., "2022-2026")
 */
export function getPoolVersionForExamType(examType: ExamType): string {
  return POOL_CONFIG[examType].currentVersion;
}

/**
 * Get the pool configuration for an exam type.
 *
 * @param examType - The exam type (technician, general, extra)
 * @returns The full pool configuration
 */
export function getPoolConfig(examType: ExamType): PoolConfig {
  return POOL_CONFIG[examType];
}

/**
 * Check if a pool version is current for a given exam type.
 *
 * @param examType - The exam type
 * @param poolVersion - The pool version to check
 * @returns True if the pool version matches the current version
 */
export function isCurrentPool(examType: ExamType, poolVersion: string): boolean {
  return POOL_CONFIG[examType].currentVersion === poolVersion;
}
