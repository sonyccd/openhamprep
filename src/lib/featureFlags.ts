/**
 * Feature flags for controlling rollout of new features.
 *
 * These flags are read from environment variables at build time.
 * To enable a feature locally, add it to your .env.local file.
 *
 * @example
 * // .env.local
 * VITE_ENABLE_EVENT_RECORDING=true
 */

export const FEATURE_FLAGS = {
  /**
   * Enable event recording to the events table.
   * When enabled, user actions are recorded alongside the existing
   * question_attempts system for richer analytics.
   *
   * Default: true (set VITE_ENABLE_EVENT_RECORDING=false to disable)
   */
  enableEventRecording: import.meta.env.VITE_ENABLE_EVENT_RECORDING !== 'false'
} as const;

/**
 * Check if a specific feature flag is enabled.
 * Useful for conditional feature checks in components.
 *
 * @param flag - The feature flag key
 * @returns Whether the feature is enabled
 *
 * @example
 * if (isFeatureEnabled('enableEventRecording')) {
 *   // Record event
 * }
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
