/**
 * Unit Tests for calculate-readiness Edge Function Logic
 * ======================================================
 *
 * Tests the pure calculation functions extracted from the Edge Function.
 * These tests verify mathematical correctness without database dependencies.
 */

import {
  assertEquals,
  assertAlmostEquals,
  assertGreater,
  assertLess,
} from "jsr:@std/assert@1";
import {
  validateExamType,
  examTypeToPrefix,
  prefixToExamType,
  calculateReadiness,
  calculateAccuracyFromAttempts,
  calculateCoverage,
  calculateMastery,
  calculateTestPassRate,
  calculateDaysSinceStudy,
  calculateEstimatedAccuracy,
  calculateBetaModifier,
  calculateRiskScore,
  calculateExpectedScore,
  calculateSingleSubelementMetric,
  calculateMetricsFromRaw,
  DEFAULT_CONFIG,
  type Config,
  type Metrics,
} from "./logic.ts";

// =============================================================================
// Input Validation Tests
// =============================================================================

Deno.test("validateExamType - accepts valid exam types", () => {
  assertEquals(validateExamType("technician"), true);
  assertEquals(validateExamType("general"), true);
  assertEquals(validateExamType("extra"), true);
});

Deno.test("validateExamType - rejects invalid exam types", () => {
  assertEquals(validateExamType("invalid"), false);
  assertEquals(validateExamType(""), false);
  assertEquals(validateExamType(null), false);
  assertEquals(validateExamType(undefined), false);
  assertEquals(validateExamType(123), false);
  assertEquals(validateExamType({}), false);
});

Deno.test("examTypeToPrefix - converts correctly", () => {
  assertEquals(examTypeToPrefix("technician"), "T");
  assertEquals(examTypeToPrefix("general"), "G");
  assertEquals(examTypeToPrefix("extra"), "E");
});

Deno.test("prefixToExamType - converts correctly", () => {
  assertEquals(prefixToExamType("T"), "technician");
  assertEquals(prefixToExamType("G"), "general");
  assertEquals(prefixToExamType("E"), "extra");
});

// =============================================================================
// Readiness Calculation Tests
// =============================================================================

Deno.test("calculateReadiness - perfect score with no recency penalty", () => {
  const metrics: Metrics = {
    recentAccuracy: 1.0,
    overallAccuracy: 1.0,
    coverage: 1.0,
    mastery: 1.0,
    testsPassed: 5,
    testsTaken: 5,
    testPassRate: 1.0,
    daysSinceStudy: 0,
    lastStudyAt: new Date().toISOString(),
    totalAttempts: 100,
    uniqueQuestionsSeen: 100,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  // 35*1 + 20*1 + 15*1 + 15*1 + 15*1 = 100
  assertEquals(result.readinessScore, 100);
  assertGreater(result.passProbability, 0.99);
  assertEquals(result.recencyPenalty, 0);
});

Deno.test("calculateReadiness - zero score for no activity", () => {
  const metrics: Metrics = {
    recentAccuracy: 0,
    overallAccuracy: 0,
    coverage: 0,
    mastery: 0,
    testsPassed: 0,
    testsTaken: 1,
    testPassRate: 0,
    daysSinceStudy: 0,
    lastStudyAt: null,
    totalAttempts: 0,
    uniqueQuestionsSeen: 0,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  assertEquals(result.readinessScore, 0);
  assertLess(result.passProbability, 0.01);
});

Deno.test("calculateReadiness - applies recency penalty", () => {
  const metricsRecent: Metrics = {
    recentAccuracy: 0.8,
    overallAccuracy: 0.8,
    coverage: 0.8,
    mastery: 0.8,
    testsPassed: 4,
    testsTaken: 5,
    testPassRate: 0.8,
    daysSinceStudy: 0,
    lastStudyAt: new Date().toISOString(),
    totalAttempts: 100,
    uniqueQuestionsSeen: 80,
    totalPoolSize: 100,
  };

  const metricsStale: Metrics = {
    ...metricsRecent,
    daysSinceStudy: 20, // 20 days = max penalty of 10
  };

  const resultRecent = calculateReadiness(metricsRecent, DEFAULT_CONFIG);
  const resultStale = calculateReadiness(metricsStale, DEFAULT_CONFIG);

  assertEquals(resultStale.recencyPenalty, 10); // Max penalty
  assertEquals(resultRecent.readinessScore - resultStale.readinessScore, 10);
});

Deno.test("calculateReadiness - recency penalty caps at max", () => {
  const metrics: Metrics = {
    recentAccuracy: 1.0,
    overallAccuracy: 1.0,
    coverage: 1.0,
    mastery: 1.0,
    testsPassed: 5,
    testsTaken: 5,
    testPassRate: 1.0,
    daysSinceStudy: 100, // Way more than max penalty threshold
    lastStudyAt: null,
    totalAttempts: 100,
    uniqueQuestionsSeen: 100,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  assertEquals(result.recencyPenalty, 10); // Capped at max_penalty
  assertEquals(result.readinessScore, 90); // 100 - 10
});

Deno.test("calculateReadiness - weighted calculation", () => {
  const metrics: Metrics = {
    recentAccuracy: 0.8,
    overallAccuracy: 0.6,
    coverage: 0.5,
    mastery: 0.4,
    testsPassed: 2,
    testsTaken: 4,
    testPassRate: 0.5,
    daysSinceStudy: 0,
    lastStudyAt: new Date().toISOString(),
    totalAttempts: 50,
    uniqueQuestionsSeen: 50,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  // 35*0.8 + 20*0.6 + 15*0.5 + 15*0.4 + 15*0.5 = 28 + 12 + 7.5 + 6 + 7.5 = 61
  assertEquals(result.readinessScore, 61);
});

Deno.test("calculateReadiness - handles null accuracy values", () => {
  const metrics: Metrics = {
    recentAccuracy: null,
    overallAccuracy: null,
    coverage: 0.5,
    mastery: 0.5,
    testsPassed: 0,
    testsTaken: 0,
    testPassRate: 0,
    daysSinceStudy: 0,
    lastStudyAt: null,
    totalAttempts: 0,
    uniqueQuestionsSeen: 50,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  // 35*0 + 20*0 + 15*0.5 + 15*0.5 + 15*0 = 15
  assertEquals(result.readinessScore, 15);
});

Deno.test("calculateReadiness - pass probability at r0 threshold is 0.5", () => {
  // Create metrics that produce a score of exactly 65 (r0 threshold)
  const metrics: Metrics = {
    recentAccuracy: 1.0,
    overallAccuracy: 1.0,
    coverage: 0.5,
    mastery: 0.5,
    testsPassed: 0,
    testsTaken: 0,
    testPassRate: 0,
    daysSinceStudy: 0,
    lastStudyAt: new Date().toISOString(),
    totalAttempts: 100,
    uniqueQuestionsSeen: 50,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);
  // 35*1 + 20*1 + 15*0.5 + 15*0.5 + 15*0 = 35 + 20 + 7.5 + 7.5 = 70

  // At r0=65, probability should be 0.5
  const customConfig: Config = {
    ...DEFAULT_CONFIG,
    pass_probability: { k: 0.15, r0: 70 }, // Set r0 to match our score
  };

  const resultAtThreshold = calculateReadiness(metrics, customConfig);
  assertAlmostEquals(resultAtThreshold.passProbability, 0.5, 0.01);
});

// =============================================================================
// Accuracy Calculation Tests
// =============================================================================

Deno.test("calculateAccuracyFromAttempts - empty array returns null", () => {
  assertEquals(calculateAccuracyFromAttempts([]), null);
});

Deno.test("calculateAccuracyFromAttempts - all correct", () => {
  const attempts = [
    { is_correct: true },
    { is_correct: true },
    { is_correct: true },
  ];
  assertEquals(calculateAccuracyFromAttempts(attempts), 1.0);
});

Deno.test("calculateAccuracyFromAttempts - all incorrect", () => {
  const attempts = [
    { is_correct: false },
    { is_correct: false },
    { is_correct: false },
  ];
  assertEquals(calculateAccuracyFromAttempts(attempts), 0);
});

Deno.test("calculateAccuracyFromAttempts - mixed results", () => {
  const attempts = [
    { is_correct: true },
    { is_correct: false },
    { is_correct: true },
    { is_correct: false },
  ];
  assertEquals(calculateAccuracyFromAttempts(attempts), 0.5);
});

// =============================================================================
// Coverage and Mastery Tests
// =============================================================================

Deno.test("calculateCoverage - full coverage", () => {
  assertEquals(calculateCoverage(100, 100), 1.0);
});

Deno.test("calculateCoverage - partial coverage", () => {
  assertEquals(calculateCoverage(50, 100), 0.5);
});

Deno.test("calculateCoverage - zero pool size returns 0", () => {
  assertEquals(calculateCoverage(50, 0), 0);
});

Deno.test("calculateMastery - full mastery", () => {
  assertEquals(calculateMastery(100, 100), 1.0);
});

Deno.test("calculateMastery - partial mastery", () => {
  assertEquals(calculateMastery(25, 100), 0.25);
});

Deno.test("calculateMastery - zero pool size returns 0", () => {
  assertEquals(calculateMastery(25, 0), 0);
});

Deno.test("calculateTestPassRate - all passed", () => {
  assertEquals(calculateTestPassRate(5, 5), 1.0);
});

Deno.test("calculateTestPassRate - none passed", () => {
  assertEquals(calculateTestPassRate(0, 5), 0);
});

Deno.test("calculateTestPassRate - zero tests returns 0", () => {
  assertEquals(calculateTestPassRate(0, 0), 0);
});

// =============================================================================
// Days Since Study Tests
// =============================================================================

Deno.test("calculateDaysSinceStudy - null returns 30", () => {
  assertEquals(calculateDaysSinceStudy(null), 30);
});

Deno.test("calculateDaysSinceStudy - recent date", () => {
  const now = new Date();
  const result = calculateDaysSinceStudy(now.toISOString());
  assertLess(result, 0.01); // Should be very close to 0
});

Deno.test("calculateDaysSinceStudy - one day ago", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = calculateDaysSinceStudy(yesterday.toISOString());
  assertAlmostEquals(result, 1, 0.01);
});

// =============================================================================
// Estimated Accuracy Blend Tests
// =============================================================================

Deno.test("calculateEstimatedAccuracy - uses overall for < min_recent", () => {
  const result = calculateEstimatedAccuracy(0.9, 0.6, 4, DEFAULT_CONFIG.blend);
  assertEquals(result, 0.6);
});

Deno.test("calculateEstimatedAccuracy - uses recent for >= recent_window", () => {
  const result = calculateEstimatedAccuracy(0.9, 0.6, 20, DEFAULT_CONFIG.blend);
  assertEquals(result, 0.9);
});

Deno.test("calculateEstimatedAccuracy - blends for intermediate counts", () => {
  // At 10 attempts: alpha = 10/20 = 0.5
  // Blend = 0.5 * 0.9 + 0.5 * 0.6 = 0.75
  const result = calculateEstimatedAccuracy(0.9, 0.6, 10, DEFAULT_CONFIG.blend);
  assertAlmostEquals(result, 0.75, 0.001);
});

Deno.test("calculateEstimatedAccuracy - handles null accuracies", () => {
  const result = calculateEstimatedAccuracy(null, null, 10, DEFAULT_CONFIG.blend);
  assertEquals(result, 0);
});

// =============================================================================
// Beta Modifier Tests
// =============================================================================

Deno.test("calculateBetaModifier - low coverage returns 1.2", () => {
  assertEquals(calculateBetaModifier(0.1, DEFAULT_CONFIG.coverage_beta), 1.2);
  assertEquals(calculateBetaModifier(0.29, DEFAULT_CONFIG.coverage_beta), 1.2);
});

Deno.test("calculateBetaModifier - mid coverage returns 1.0", () => {
  assertEquals(calculateBetaModifier(0.3, DEFAULT_CONFIG.coverage_beta), 1.0);
  assertEquals(calculateBetaModifier(0.5, DEFAULT_CONFIG.coverage_beta), 1.0);
  assertEquals(calculateBetaModifier(0.69, DEFAULT_CONFIG.coverage_beta), 1.0);
});

Deno.test("calculateBetaModifier - high coverage returns 0.9", () => {
  assertEquals(calculateBetaModifier(0.7, DEFAULT_CONFIG.coverage_beta), 0.9);
  assertEquals(calculateBetaModifier(0.9, DEFAULT_CONFIG.coverage_beta), 0.9);
  assertEquals(calculateBetaModifier(1.0, DEFAULT_CONFIG.coverage_beta), 0.9);
});

// =============================================================================
// Risk and Expected Score Tests
// =============================================================================

Deno.test("calculateRiskScore - low coverage increases risk", () => {
  // Low coverage (beta = 1.2): risk = 6 * (1 - 0.8) * 1.2 = 1.44
  const result = calculateRiskScore(6, 0.8, 0.2, DEFAULT_CONFIG.coverage_beta);
  assertAlmostEquals(result, 1.44, 0.001);
});

Deno.test("calculateRiskScore - high coverage reduces risk", () => {
  // High coverage (beta = 0.9): risk = 6 * (1 - 0.8) * 0.9 = 1.08
  const result = calculateRiskScore(6, 0.8, 0.8, DEFAULT_CONFIG.coverage_beta);
  assertAlmostEquals(result, 1.08, 0.001);
});

Deno.test("calculateRiskScore - perfect accuracy has zero risk", () => {
  const result = calculateRiskScore(6, 1.0, 0.5, DEFAULT_CONFIG.coverage_beta);
  assertEquals(result, 0);
});

Deno.test("calculateExpectedScore - correct calculation", () => {
  assertAlmostEquals(calculateExpectedScore(6, 0.8), 4.8, 0.001);
  assertEquals(calculateExpectedScore(4, 0.5), 2);
  assertEquals(calculateExpectedScore(3, 1.0), 3);
  assertEquals(calculateExpectedScore(6, 0), 0);
});

// =============================================================================
// Subelement Metric Tests
// =============================================================================

Deno.test("calculateSingleSubelementMetric - empty attempts", () => {
  const result = calculateSingleSubelementMetric(
    {
      code: "T1",
      weight: 6,
      poolSize: 50,
      attempts: [],
      masteredQuestionIds: new Set(),
    },
    DEFAULT_CONFIG
  );

  assertEquals(result.accuracy, null);
  assertEquals(result.recent_accuracy, null);
  assertEquals(result.coverage, 0);
  assertEquals(result.mastery, 0);
  assertEquals(result.attempts_count, 0);
  assertEquals(result.weight, 6);
  assertEquals(result.pool_size, 50);
});

Deno.test("calculateSingleSubelementMetric - with attempts and mastery", () => {
  const attempts = [
    { question_id: "q1", is_correct: true, attempted_at: "2024-01-10T00:00:00Z" },
    { question_id: "q2", is_correct: true, attempted_at: "2024-01-09T00:00:00Z" },
    { question_id: "q3", is_correct: false, attempted_at: "2024-01-08T00:00:00Z" },
    { question_id: "q1", is_correct: true, attempted_at: "2024-01-07T00:00:00Z" },
  ];

  const result = calculateSingleSubelementMetric(
    {
      code: "T1",
      weight: 6,
      poolSize: 10,
      attempts,
      masteredQuestionIds: new Set(["q1", "q2"]),
    },
    DEFAULT_CONFIG
  );

  assertEquals(result.accuracy, 0.75); // 3/4 correct
  assertEquals(result.recent_accuracy, 0.75); // All 4 within recent window
  assertEquals(result.coverage, 0.3); // 3 unique questions / 10 pool
  assertEquals(result.mastery, 0.2); // 2 mastered / 10 pool
  assertEquals(result.attempts_count, 4);
  assertEquals(result.recent_attempts_count, 4);
  assertEquals(result.weight, 6);
});

// =============================================================================
// Metrics From Raw Data Tests
// =============================================================================

Deno.test("calculateMetricsFromRaw - complete scenario", () => {
  const now = Date.now();
  const attempts = [
    { question_id: "q1", is_correct: true, attempted_at: new Date(now).toISOString() },
    { question_id: "q2", is_correct: true, attempted_at: new Date(now - 60000).toISOString() },
    { question_id: "q3", is_correct: false, attempted_at: new Date(now - 120000).toISOString() },
    { question_id: "q4", is_correct: true, attempted_at: new Date(now - 180000).toISOString() },
  ];

  const result = calculateMetricsFromRaw({
    attempts,
    masteredCount: 10,
    totalPoolSize: 100,
    testsPassed: 3,
    testsTaken: 5,
    recentWindow: 10,
  });

  assertEquals(result.totalAttempts, 4);
  assertEquals(result.recentAccuracy, 0.75);
  assertEquals(result.overallAccuracy, 0.75);
  assertEquals(result.uniqueQuestionsSeen, 4);
  assertEquals(result.coverage, 0.04);
  assertEquals(result.mastery, 0.1);
  assertEquals(result.testsPassed, 3);
  assertEquals(result.testsTaken, 5);
  assertEquals(result.testPassRate, 0.6);
  assertEquals(result.totalPoolSize, 100);
});

Deno.test("calculateMetricsFromRaw - empty attempts", () => {
  const result = calculateMetricsFromRaw({
    attempts: [],
    masteredCount: 0,
    totalPoolSize: 100,
    testsPassed: 0,
    testsTaken: 0,
    recentWindow: 50,
  });

  assertEquals(result.totalAttempts, 0);
  assertEquals(result.recentAccuracy, null);
  assertEquals(result.overallAccuracy, null);
  assertEquals(result.uniqueQuestionsSeen, 0);
  assertEquals(result.coverage, 0);
  assertEquals(result.mastery, 0);
  assertEquals(result.testPassRate, 0);
  assertEquals(result.daysSinceStudy, 30);
  assertEquals(result.lastStudyAt, null);
});

// =============================================================================
// Edge Cases
// =============================================================================

Deno.test("edge case - score clamped to 0-100 range", () => {
  // Very high penalty that would make score negative
  const metrics: Metrics = {
    recentAccuracy: 0.1,
    overallAccuracy: 0.1,
    coverage: 0.1,
    mastery: 0.1,
    testsPassed: 0,
    testsTaken: 1,
    testPassRate: 0,
    daysSinceStudy: 100,
    lastStudyAt: null,
    totalAttempts: 10,
    uniqueQuestionsSeen: 10,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, DEFAULT_CONFIG);

  // Raw: 35*0.1 + 20*0.1 + 15*0.1 + 15*0.1 + 15*0 - 10 = 8.5 - 10 = -1.5
  // But should be clamped to 0
  assertEquals(result.readinessScore, 0);
});

Deno.test("edge case - custom config weights", () => {
  const customConfig: Config = {
    ...DEFAULT_CONFIG,
    formula_weights: {
      recent_accuracy: 50,
      overall_accuracy: 25,
      coverage: 10,
      mastery: 10,
      test_rate: 5,
    },
  };

  const metrics: Metrics = {
    recentAccuracy: 1.0,
    overallAccuracy: 1.0,
    coverage: 1.0,
    mastery: 1.0,
    testsPassed: 1,
    testsTaken: 1,
    testPassRate: 1.0,
    daysSinceStudy: 0,
    lastStudyAt: new Date().toISOString(),
    totalAttempts: 100,
    uniqueQuestionsSeen: 100,
    totalPoolSize: 100,
  };

  const result = calculateReadiness(metrics, customConfig);
  assertEquals(result.readinessScore, 100);
});

// =============================================================================
// DEFAULT_CONFIG Validation Tests
// =============================================================================

Deno.test("DEFAULT_CONFIG - weights sum to 100", () => {
  const w = DEFAULT_CONFIG.formula_weights;
  const sum = w.recent_accuracy + w.overall_accuracy + w.coverage + w.mastery + w.test_rate;
  assertEquals(sum, 100);
});

Deno.test("DEFAULT_CONFIG - valid pass probability parameters", () => {
  assertGreater(DEFAULT_CONFIG.pass_probability.k, 0);
  assertGreater(DEFAULT_CONFIG.pass_probability.r0, 0);
  assertLess(DEFAULT_CONFIG.pass_probability.r0, 100);
});

Deno.test("DEFAULT_CONFIG - valid recency penalty parameters", () => {
  assertGreater(DEFAULT_CONFIG.recency_penalty.max_penalty, 0);
  assertGreater(DEFAULT_CONFIG.recency_penalty.decay_rate, 0);
});

Deno.test("DEFAULT_CONFIG - valid coverage beta thresholds", () => {
  assertLess(
    DEFAULT_CONFIG.coverage_beta.low_threshold,
    DEFAULT_CONFIG.coverage_beta.high_threshold
  );
});
