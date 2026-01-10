/**
 * Readiness Scoring Model - Core Calculation Functions
 * =====================================================
 *
 * This module contains all the mathematical formulas for the readiness scoring model.
 * These functions are used by both the edge function (server-side) and can be imported
 * for client-side calculations or testing.
 *
 * The formulas are centralized here to ensure consistency and make it easy to modify
 * the algorithm without breaking multiple locations.
 *
 * @see docs/Readiness_Scoring_Model.md for the full specification
 */

// =============================================================================
// Configuration Types
// =============================================================================

export interface FormulaWeights {
  recent_accuracy: number;
  overall_accuracy: number;
  coverage: number;
  mastery: number;
  test_rate: number;
}

export interface PassProbabilityConfig {
  k: number;
  r0: number;
}

export interface RecencyPenaltyConfig {
  max_penalty: number;
  decay_rate: number;
}

export interface CoverageBetaConfig {
  low: number;
  mid: number;
  high: number;
  low_threshold: number;
  high_threshold: number;
}

export interface ReadinessConfig {
  formula_weights: FormulaWeights;
  pass_probability: PassProbabilityConfig;
  recency_penalty: RecencyPenaltyConfig;
  coverage_beta: CoverageBetaConfig;
}

// =============================================================================
// Default Configuration (matches database defaults)
// =============================================================================

export const DEFAULT_CONFIG: ReadinessConfig = {
  formula_weights: {
    recent_accuracy: 35,
    overall_accuracy: 20,
    coverage: 15,
    mastery: 15,
    test_rate: 15,
  },
  pass_probability: {
    k: 0.15,
    r0: 65,
  },
  recency_penalty: {
    max_penalty: 10,
    decay_rate: 0.5,
  },
  coverage_beta: {
    low: 1.2,
    mid: 1.0,
    high: 0.9,
    low_threshold: 0.3,
    high_threshold: 0.7,
  },
};

// =============================================================================
// Core Calculation Functions
// =============================================================================

/**
 * Calculate the recency penalty based on days since last study.
 * δ(D) = min(max_penalty, decay_rate * D)
 *
 * @param daysSinceStudy - Number of days since last study session
 * @param config - Recency penalty configuration
 * @returns The penalty to subtract from the readiness score (0 to max_penalty)
 */
export function calculateRecencyPenalty(
  daysSinceStudy: number,
  config: RecencyPenaltyConfig = DEFAULT_CONFIG.recency_penalty
): number {
  return Math.min(config.max_penalty, config.decay_rate * daysSinceStudy);
}

/**
 * Calculate the overall readiness score.
 * R = w1·A_r + w2·A_o + w3·C + w4·M + w5·T_rate - δ(D)
 *
 * Where T_rate = T_p / max(T_t, 1)
 *
 * @param recentAccuracy - Recent accuracy (0-1), last N questions
 * @param overallAccuracy - Overall lifetime accuracy (0-1)
 * @param coverage - Fraction of unique questions seen (0-1)
 * @param mastery - Fraction of questions correct 2+ times (0-1)
 * @param testsPassed - Number of practice tests passed
 * @param testsTaken - Total number of practice tests taken
 * @param daysSinceStudy - Days since last study session
 * @param config - Full readiness configuration
 * @returns Readiness score (0-100, but can go negative with max penalty)
 */
export function calculateReadinessScore(
  recentAccuracy: number,
  overallAccuracy: number,
  coverage: number,
  mastery: number,
  testsPassed: number,
  testsTaken: number,
  daysSinceStudy: number,
  config: ReadinessConfig = DEFAULT_CONFIG
): number {
  const w = config.formula_weights;
  const testRate = testsPassed / Math.max(testsTaken, 1);
  const recencyPenalty = calculateRecencyPenalty(daysSinceStudy, config.recency_penalty);

  return (
    w.recent_accuracy * recentAccuracy +
    w.overall_accuracy * overallAccuracy +
    w.coverage * coverage +
    w.mastery * mastery +
    w.test_rate * testRate -
    recencyPenalty
  );
}

/**
 * Calculate pass probability using a logistic function.
 * P(pass) = 1 / (1 + e^(-k(R - R_0)))
 *
 * @param readinessScore - The calculated readiness score
 * @param config - Pass probability configuration (k and r0)
 * @returns Probability of passing (0-1)
 */
export function calculatePassProbability(
  readinessScore: number,
  config: PassProbabilityConfig = DEFAULT_CONFIG.pass_probability
): number {
  const exponent = -config.k * (readinessScore - config.r0);
  return 1.0 / (1.0 + Math.exp(exponent));
}

/**
 * Calculate the beta modifier based on coverage level.
 * β_s = 1.2 if coverage < 0.3 (low coverage amplifies risk)
 * β_s = 1.0 if 0.3 <= coverage < 0.7 (moderate coverage)
 * β_s = 0.9 if coverage >= 0.7 (high coverage reduces risk)
 *
 * @param coverage - Coverage fraction (0-1)
 * @param config - Coverage beta configuration
 * @returns Beta modifier (0.9, 1.0, or 1.2)
 */
export function calculateBetaModifier(
  coverage: number,
  config: CoverageBetaConfig = DEFAULT_CONFIG.coverage_beta
): number {
  if (coverage < config.low_threshold) {
    return config.low;
  } else if (coverage < config.high_threshold) {
    return config.mid;
  } else {
    return config.high;
  }
}

/**
 * Calculate estimated accuracy using a weighted blend.
 * - If recentCount >= 20: use recent accuracy only
 * - If 5 <= recentCount < 20: blend recent and overall (α = recentCount/20)
 * - If recentCount < 5: use overall accuracy only
 *
 * @param recentAccuracy - Recent accuracy (0-1)
 * @param overallAccuracy - Overall accuracy (0-1)
 * @param recentCount - Number of recent attempts
 * @returns Estimated accuracy (0-1)
 */
export function calculateEstimatedAccuracy(
  recentAccuracy: number,
  overallAccuracy: number,
  recentCount: number
): number {
  if (recentCount >= 20) {
    return recentAccuracy;
  } else if (recentCount >= 5) {
    const alpha = recentCount / 20.0;
    return alpha * recentAccuracy + (1 - alpha) * overallAccuracy;
  } else {
    return overallAccuracy;
  }
}

/**
 * Calculate expected score for a subelement.
 * E_s = w_s · Â_s
 *
 * @param weight - Number of exam questions from this subelement
 * @param estimatedAccuracy - Estimated accuracy (0-1)
 * @returns Expected number of correct answers
 */
export function calculateExpectedScore(
  weight: number,
  estimatedAccuracy: number
): number {
  return weight * estimatedAccuracy;
}

/**
 * Calculate risk score for a subelement.
 * Risk_s = w_s · (1 - Â_s) · β_s
 *
 * @param weight - Number of exam questions from this subelement
 * @param estimatedAccuracy - Estimated accuracy (0-1)
 * @param coverage - Coverage fraction (0-1)
 * @param config - Coverage beta configuration
 * @returns Risk score (higher = more risk of losing points)
 */
export function calculateRiskScore(
  weight: number,
  estimatedAccuracy: number,
  coverage: number,
  config: CoverageBetaConfig = DEFAULT_CONFIG.coverage_beta
): number {
  const beta = calculateBetaModifier(coverage, config);
  return weight * (1 - estimatedAccuracy) * beta;
}

/**
 * Calculate expected questions lost for a subelement.
 * L_s = w_s · (1 - Â_s)
 *
 * @param weight - Number of exam questions from this subelement
 * @param estimatedAccuracy - Estimated accuracy (0-1)
 * @returns Expected number of incorrect answers
 */
export function calculateExpectedQuestionsLost(
  weight: number,
  estimatedAccuracy: number
): number {
  return weight * (1 - estimatedAccuracy);
}

/**
 * Calculate priority score for a subelement.
 * Priority_s = Risk_s · (1 - M_s)
 *
 * High mastery reduces priority since the student has already demonstrated
 * understanding of those questions.
 *
 * @param riskScore - The subelement's risk score
 * @param mastery - Mastery fraction (0-1)
 * @returns Priority score (higher = should study this more)
 */
export function calculatePriorityScore(
  riskScore: number,
  mastery: number
): number {
  return riskScore * (1 - mastery);
}

/**
 * Calculate accuracy trend.
 * ΔA = A_r - A_prev
 *
 * @param recentAccuracy - Current recent accuracy (0-1)
 * @param previousAccuracy - Previous period accuracy (0-1)
 * @returns Trend value (positive = improving, negative = declining)
 */
export function calculateAccuracyTrend(
  recentAccuracy: number,
  previousAccuracy: number
): number {
  return recentAccuracy - previousAccuracy;
}

/**
 * Calculate Wilson score confidence interval for a proportion.
 * Used to provide confidence bounds on accuracy estimates.
 *
 * @param accuracy - Observed accuracy (0-1)
 * @param n - Sample size (number of attempts)
 * @param z - Z-score for confidence level (default 1.96 for 95% CI)
 * @returns [lower, upper] bounds of the confidence interval
 */
export function wilsonScoreInterval(
  accuracy: number,
  n: number,
  z: number = 1.96
): [number, number] {
  if (n === 0) {
    return [0.0, 1.0];
  }

  const denominator = 1 + (z ** 2) / n;
  const center = (accuracy + (z ** 2) / (2 * n)) / denominator;

  const marginBase =
    (accuracy * (1 - accuracy)) / n + (z ** 2) / (4 * n ** 2);
  const margin = (z * Math.sqrt(marginBase)) / denominator;

  const lower = Math.max(0.0, center - margin);
  const upper = Math.min(1.0, center + margin);

  return [lower, upper];
}

// =============================================================================
// Exam Structure Constants
// =============================================================================

export interface SubelementInfo {
  topic: string;
  examQuestions: number;
  poolQuestions: number;
}

export const TECHNICIAN_SUBELEMENTS: Record<string, SubelementInfo> = {
  T1: { topic: 'FCC Rules', examQuestions: 6, poolQuestions: 72 },
  T2: { topic: 'Operating Procedures', examQuestions: 3, poolQuestions: 36 },
  T3: { topic: 'Radio Wave Characteristics', examQuestions: 3, poolQuestions: 36 },
  T4: { topic: 'Amateur Radio Practices', examQuestions: 2, poolQuestions: 24 },
  T5: { topic: 'Electrical Principles', examQuestions: 4, poolQuestions: 68 },
  T6: { topic: 'Electronic Components', examQuestions: 4, poolQuestions: 44 },
  T7: { topic: 'Station Equipment', examQuestions: 4, poolQuestions: 48 },
  T8: { topic: 'Modulation & Signals', examQuestions: 4, poolQuestions: 44 },
  T9: { topic: 'Antennas & Feedlines', examQuestions: 2, poolQuestions: 24 },
  T0: { topic: 'Safety', examQuestions: 3, poolQuestions: 16 },
};

export const GENERAL_SUBELEMENTS: Record<string, SubelementInfo> = {
  G1: { topic: 'Commission Rules', examQuestions: 5, poolQuestions: 74 },
  G2: { topic: 'Operating Procedures', examQuestions: 5, poolQuestions: 70 },
  G3: { topic: 'Radio Wave Propagation', examQuestions: 3, poolQuestions: 42 },
  G4: { topic: 'Amateur Radio Practices', examQuestions: 5, poolQuestions: 67 },
  G5: { topic: 'Electrical Principles', examQuestions: 3, poolQuestions: 40 },
  G6: { topic: 'Circuit Components', examQuestions: 2, poolQuestions: 29 },
  G7: { topic: 'Practical Circuits', examQuestions: 3, poolQuestions: 40 },
  G8: { topic: 'Signals and Emissions', examQuestions: 3, poolQuestions: 37 },
  G9: { topic: 'Antennas and Feedlines', examQuestions: 4, poolQuestions: 56 },
  G0: { topic: 'Safety', examQuestions: 2, poolQuestions: 27 },
};

export const EXTRA_SUBELEMENTS: Record<string, SubelementInfo> = {
  E1: { topic: 'Commission Rules', examQuestions: 6, poolQuestions: 69 },
  E2: { topic: 'Operating Procedures', examQuestions: 5, poolQuestions: 62 },
  E3: { topic: 'Radio Wave Propagation', examQuestions: 3, poolQuestions: 38 },
  E4: { topic: 'Amateur Practices', examQuestions: 5, poolQuestions: 64 },
  E5: { topic: 'Electrical Principles', examQuestions: 4, poolQuestions: 57 },
  E6: { topic: 'Circuit Components', examQuestions: 6, poolQuestions: 68 },
  E7: { topic: 'Practical Circuits', examQuestions: 8, poolQuestions: 106 },
  E8: { topic: 'Signals and Emissions', examQuestions: 4, poolQuestions: 53 },
  E9: { topic: 'Antennas', examQuestions: 8, poolQuestions: 96 },
  E0: { topic: 'Safety', examQuestions: 1, poolQuestions: 9 },
};

export const EXAM_PASSING_SCORES = {
  technician: { total: 35, passing: 26 },
  general: { total: 35, passing: 26 },
  extra: { total: 50, passing: 37 },
};
