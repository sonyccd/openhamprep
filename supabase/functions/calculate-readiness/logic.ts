// ============================================================
// PURE CALCULATION LOGIC - Extracted for testability
// ============================================================

// Type definitions
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

export interface BlendConfig {
  min_recent_for_blend: number;
  recent_window: number;
}

export interface ThresholdsConfig {
  min_attempts: number;
  min_per_subelement: number;
  recent_window: number;
  subelement_recent_window: number;
}

export interface Config {
  formula_weights: FormulaWeights;
  pass_probability: PassProbabilityConfig;
  recency_penalty: RecencyPenaltyConfig;
  coverage_beta: CoverageBetaConfig;
  blend: BlendConfig;
  thresholds: ThresholdsConfig;
  version: string;
}

export interface Metrics {
  recentAccuracy: number | null;
  overallAccuracy: number | null;
  coverage: number;
  mastery: number;
  testsPassed: number;
  testsTaken: number;
  testPassRate: number;
  daysSinceStudy: number;
  lastStudyAt: string | null;
  totalAttempts: number;
  uniqueQuestionsSeen: number;
  totalPoolSize: number;
}

export interface SubelementMetric {
  accuracy: number | null;
  recent_accuracy: number | null;
  coverage: number;
  mastery: number;
  risk_score: number;
  expected_score: number;
  weight: number;
  pool_size: number;
  attempts_count: number;
  recent_attempts_count: number;
}

export interface ReadinessResult {
  readinessScore: number;
  passProbability: number;
  recencyPenalty: number;
  expectedExamScore: number;
}

export interface SubelementData {
  code: string;
  weight: number;
}

export interface AttemptData {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

export const DEFAULT_CONFIG: Config = {
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
  blend: {
    min_recent_for_blend: 5,
    recent_window: 20,
  },
  thresholds: {
    min_attempts: 50,
    min_per_subelement: 2,
    recent_window: 50,
    subelement_recent_window: 20,
  },
  version: "v1.0.0-default",
};

// ============================================================
// INPUT VALIDATION
// ============================================================

export function validateExamType(examType: unknown): examType is "technician" | "general" | "extra" {
  return typeof examType === "string" &&
    ["technician", "general", "extra"].includes(examType);
}

export function examTypeToPrefix(examType: "technician" | "general" | "extra"): string {
  return examType === "technician" ? "T" : examType === "general" ? "G" : "E";
}

export function prefixToExamType(prefix: string): "technician" | "general" | "extra" {
  return prefix === "T" ? "technician" : prefix === "G" ? "general" : "extra";
}

// ============================================================
// READINESS CALCULATION
// ============================================================

export function calculateReadiness(metrics: Metrics, config: Config): ReadinessResult {
  const w = config.formula_weights;

  // Readiness Score: R = w1*A_r + w2*A_o + w3*C + w4*M + w5*T_rate - penalty
  const rawScore =
    w.recent_accuracy * (metrics.recentAccuracy ?? 0) +
    w.overall_accuracy * (metrics.overallAccuracy ?? 0) +
    w.coverage * metrics.coverage +
    w.mastery * metrics.mastery +
    w.test_rate * metrics.testPassRate;

  // Recency penalty: penalty = min(max_penalty, decay_rate * days)
  const recencyPenalty = Math.min(
    config.recency_penalty.max_penalty,
    config.recency_penalty.decay_rate * metrics.daysSinceStudy
  );

  // Clamp final score to 0-100
  const readinessScore = Math.max(0, Math.min(100, rawScore - recencyPenalty));

  // Pass probability using logistic function: P = 1 / (1 + e^(-k(R - R_0)))
  const { k, r0 } = config.pass_probability;
  const passProbability = 1 / (1 + Math.exp(-k * (readinessScore - r0)));

  return {
    readinessScore,
    passProbability,
    recencyPenalty,
    expectedExamScore: 0,
  };
}

// ============================================================
// METRICS CALCULATION HELPERS
// ============================================================

export function calculateAccuracyFromAttempts(
  attempts: Array<{ is_correct: boolean }>
): number | null {
  if (attempts.length === 0) return null;
  const correct = attempts.filter((a) => a.is_correct).length;
  return correct / attempts.length;
}

export function calculateCoverage(uniqueQuestionsSeen: number, totalPoolSize: number): number {
  return totalPoolSize > 0 ? uniqueQuestionsSeen / totalPoolSize : 0;
}

export function calculateMastery(masteredCount: number, totalPoolSize: number): number {
  return totalPoolSize > 0 ? masteredCount / totalPoolSize : 0;
}

export function calculateTestPassRate(testsPassed: number, testsTaken: number): number {
  return testsTaken > 0 ? testsPassed / testsTaken : 0;
}

export function calculateDaysSinceStudy(lastStudyAt: string | null): number {
  if (!lastStudyAt) return 30;
  return (Date.now() - new Date(lastStudyAt).getTime()) / (1000 * 60 * 60 * 24);
}

// ============================================================
// SUBELEMENT METRICS CALCULATION
// ============================================================

export function calculateEstimatedAccuracy(
  recentAccuracy: number | null,
  overallAccuracy: number | null,
  recentAttemptsCount: number,
  config: BlendConfig
): number {
  if (recentAttemptsCount >= config.recent_window) {
    return recentAccuracy ?? 0;
  } else if (recentAttemptsCount >= config.min_recent_for_blend) {
    const alpha = recentAttemptsCount / config.recent_window;
    return alpha * (recentAccuracy ?? 0) + (1 - alpha) * (overallAccuracy ?? 0);
  } else {
    return overallAccuracy ?? 0;
  }
}

export function calculateBetaModifier(coverage: number, config: CoverageBetaConfig): number {
  if (coverage < config.low_threshold) {
    return config.low;
  } else if (coverage >= config.high_threshold) {
    return config.high;
  } else {
    return config.mid;
  }
}

export function calculateRiskScore(
  weight: number,
  estimatedAccuracy: number,
  coverage: number,
  betaConfig: CoverageBetaConfig
): number {
  const beta = calculateBetaModifier(coverage, betaConfig);
  return weight * (1 - estimatedAccuracy) * beta;
}

export function calculateExpectedScore(weight: number, estimatedAccuracy: number): number {
  return weight * estimatedAccuracy;
}

export interface SubelementInput {
  code: string;
  weight: number;
  poolSize: number;
  attempts: AttemptData[];
  masteredQuestionIds: Set<string>;
}

export function calculateSingleSubelementMetric(
  input: SubelementInput,
  config: Config
): SubelementMetric {
  const { weight, poolSize, attempts, masteredQuestionIds } = input;

  const attemptsCount = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = attemptsCount > 0 ? correctCount / attemptsCount : null;

  // Recent accuracy (last N per subelement) - assumes attempts are sorted by date desc
  const recentWindow = config.thresholds.subelement_recent_window;
  const recentAttempts = attempts.slice(0, recentWindow);
  const recentCorrect = recentAttempts.filter((a) => a.is_correct).length;
  const recentAccuracy = recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : null;
  const recentAttemptsCount = recentAttempts.length;

  // Coverage - unique questions seen
  const uniqueQuestionsSeen = new Set(attempts.map((a) => a.question_id)).size;
  const coverage = poolSize > 0 ? uniqueQuestionsSeen / poolSize : 0;

  // Mastery
  const mastery = poolSize > 0 ? masteredQuestionIds.size / poolSize : 0;

  // Estimated accuracy using blend formula
  const estimatedAccuracy = calculateEstimatedAccuracy(
    recentAccuracy,
    accuracy,
    recentAttemptsCount,
    config.blend
  );

  // Risk and expected scores
  const riskScore = calculateRiskScore(weight, estimatedAccuracy, coverage, config.coverage_beta);
  const expectedScore = calculateExpectedScore(weight, estimatedAccuracy);

  return {
    accuracy,
    recent_accuracy: recentAccuracy,
    coverage,
    mastery,
    risk_score: riskScore,
    expected_score: expectedScore,
    weight,
    pool_size: poolSize,
    attempts_count: attemptsCount,
    recent_attempts_count: recentAttemptsCount,
  };
}

// ============================================================
// AGGREGATE METRICS FROM RAW DATA
// ============================================================

export interface RawMetricsInput {
  attempts: Array<{ is_correct: boolean; attempted_at: string; question_id: string }>;
  masteredCount: number;
  totalPoolSize: number;
  testsPassed: number;
  testsTaken: number;
  recentWindow: number;
}

export function calculateMetricsFromRaw(input: RawMetricsInput): Metrics {
  const {
    attempts,
    masteredCount,
    totalPoolSize,
    testsPassed,
    testsTaken,
    recentWindow,
  } = input;

  const totalAttempts = attempts.length;

  // Recent accuracy (last N questions)
  const recentAttempts = attempts.slice(0, recentWindow);
  const recentCorrect = recentAttempts.filter((a) => a.is_correct).length;
  const recentAccuracy = recentAttempts.length > 0 ? recentCorrect / recentAttempts.length : null;

  // Overall accuracy
  const overallCorrect = attempts.filter((a) => a.is_correct).length;
  const overallAccuracy = totalAttempts > 0 ? overallCorrect / totalAttempts : null;

  // Unique questions seen (coverage)
  const uniqueQuestionIds = new Set(attempts.map((a) => a.question_id));
  const uniqueQuestionsSeen = uniqueQuestionIds.size;
  const coverage = calculateCoverage(uniqueQuestionsSeen, totalPoolSize);

  // Mastery
  const mastery = calculateMastery(masteredCount, totalPoolSize);

  // Test pass rate
  const testPassRate = calculateTestPassRate(testsPassed, testsTaken);

  // Days since last study
  const lastStudyAt = attempts.length > 0 ? attempts[0].attempted_at : null;
  const daysSinceStudy = calculateDaysSinceStudy(lastStudyAt);

  return {
    recentAccuracy,
    overallAccuracy,
    coverage,
    mastery,
    testsPassed,
    testsTaken,
    testPassRate,
    daysSinceStudy,
    lastStudyAt,
    totalAttempts,
    uniqueQuestionsSeen,
    totalPoolSize,
  };
}
