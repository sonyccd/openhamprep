/**
 * Readiness Scoring Model - Comprehensive Test Suite
 * ===================================================
 *
 * Tests all calculation functions from readinessScoring.ts
 * These tests ensure mathematical correctness and catch any formula changes.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRecencyPenalty,
  calculateReadinessScore,
  calculatePassProbability,
  calculateBetaModifier,
  calculateEstimatedAccuracy,
  calculateExpectedScore,
  calculateRiskScore,
  calculateExpectedQuestionsLost,
  calculatePriorityScore,
  calculateAccuracyTrend,
  wilsonScoreInterval,
  DEFAULT_CONFIG,
  TECHNICIAN_SUBELEMENTS,
  GENERAL_SUBELEMENTS,
  EXTRA_SUBELEMENTS,
  EXAM_PASSING_SCORES,
} from './readinessScoring';

// =============================================================================
// Recency Penalty Tests
// =============================================================================

describe('calculateRecencyPenalty', () => {
  it('returns 0 for 0 days', () => {
    expect(calculateRecencyPenalty(0)).toBe(0);
  });

  it('scales linearly with days', () => {
    // Default decay_rate is 0.5, so 10 days = 5 penalty
    expect(calculateRecencyPenalty(10)).toBe(5);
  });

  it('caps at max_penalty', () => {
    // Default max_penalty is 10, so 30 days should cap at 10
    expect(calculateRecencyPenalty(30)).toBe(10);
    expect(calculateRecencyPenalty(100)).toBe(10);
  });

  it('uses custom config', () => {
    const customConfig = { max_penalty: 20, decay_rate: 1.0 };
    expect(calculateRecencyPenalty(15, customConfig)).toBe(15);
    expect(calculateRecencyPenalty(25, customConfig)).toBe(20); // capped
  });

  it('handles fractional days', () => {
    // 0.5 days * 0.5 decay_rate = 0.25 penalty
    expect(calculateRecencyPenalty(0.5)).toBe(0.25);
  });
});

// =============================================================================
// Readiness Score Tests
// =============================================================================

describe('calculateReadinessScore', () => {
  it('returns 100 for perfect inputs with no recency penalty', () => {
    // All inputs at 1.0, 1 test passed out of 1, 0 days since study
    const score = calculateReadinessScore(1.0, 1.0, 1.0, 1.0, 1, 1, 0);
    // 35*1 + 20*1 + 15*1 + 15*1 + 15*1 - 0 = 100
    expect(score).toBe(100);
  });

  it('returns 0 for zero inputs', () => {
    const score = calculateReadinessScore(0, 0, 0, 0, 0, 1, 0);
    expect(score).toBe(0);
  });

  it('applies recency penalty correctly', () => {
    // Perfect score minus 10 days penalty (5 points with default config)
    const score = calculateReadinessScore(1.0, 1.0, 1.0, 1.0, 1, 1, 10);
    expect(score).toBe(95);
  });

  it('calculates weighted sum correctly', () => {
    // 0.8 recent, 0.6 overall, 0.5 coverage, 0.4 mastery, 2/4 tests, 0 days
    const score = calculateReadinessScore(0.8, 0.6, 0.5, 0.4, 2, 4, 0);
    // 35*0.8 + 20*0.6 + 15*0.5 + 15*0.4 + 15*0.5 - 0
    // = 28 + 12 + 7.5 + 6 + 7.5 = 61
    expect(score).toBe(61);
  });

  it('handles zero tests taken', () => {
    // test_rate = 0/max(0,1) = 0
    const score = calculateReadinessScore(0.8, 0.6, 0.5, 0.4, 0, 0, 0);
    // 35*0.8 + 20*0.6 + 15*0.5 + 15*0.4 + 15*0 = 53.5
    expect(score).toBe(53.5);
  });

  it('can go negative with large recency penalty', () => {
    // 20 days = 10 penalty (capped), low scores
    const score = calculateReadinessScore(0.1, 0.1, 0.1, 0.1, 0, 1, 20);
    // 35*0.1 + 20*0.1 + 15*0.1 + 15*0.1 + 15*0 - 10
    // = 3.5 + 2 + 1.5 + 1.5 + 0 - 10 = -1.5
    expect(score).toBe(-1.5);
  });

  it('uses custom config weights', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      formula_weights: {
        recent_accuracy: 50,
        overall_accuracy: 25,
        coverage: 10,
        mastery: 10,
        test_rate: 5,
      },
    };
    const score = calculateReadinessScore(1.0, 1.0, 1.0, 1.0, 1, 1, 0, customConfig);
    expect(score).toBe(100);
  });
});

// =============================================================================
// Pass Probability Tests
// =============================================================================

describe('calculatePassProbability', () => {
  it('returns ~0.5 at r0 threshold', () => {
    // At r0 = 65, probability should be exactly 0.5
    const prob = calculatePassProbability(65);
    expect(prob).toBeCloseTo(0.5, 5);
  });

  it('returns high probability for high scores', () => {
    const prob = calculatePassProbability(85);
    expect(prob).toBeGreaterThan(0.9);
  });

  it('returns low probability for low scores', () => {
    const prob = calculatePassProbability(45);
    expect(prob).toBeLessThan(0.1);
  });

  it('is bounded between 0 and 1', () => {
    expect(calculatePassProbability(0)).toBeGreaterThan(0);
    expect(calculatePassProbability(0)).toBeLessThan(1);
    expect(calculatePassProbability(100)).toBeGreaterThan(0);
    expect(calculatePassProbability(100)).toBeLessThan(1);
  });

  it('is monotonically increasing', () => {
    const p50 = calculatePassProbability(50);
    const p60 = calculatePassProbability(60);
    const p70 = calculatePassProbability(70);
    const p80 = calculatePassProbability(80);

    expect(p60).toBeGreaterThan(p50);
    expect(p70).toBeGreaterThan(p60);
    expect(p80).toBeGreaterThan(p70);
  });

  it('uses custom k parameter for steepness', () => {
    // Higher k = steeper curve
    const defaultProb = calculatePassProbability(75);
    const steepProb = calculatePassProbability(75, { k: 0.3, r0: 65 });

    expect(steepProb).toBeGreaterThan(defaultProb);
  });

  it('uses custom r0 parameter for midpoint', () => {
    // Shift midpoint to 50
    const prob = calculatePassProbability(50, { k: 0.15, r0: 50 });
    expect(prob).toBeCloseTo(0.5, 5);
  });
});

// =============================================================================
// Beta Modifier Tests
// =============================================================================

describe('calculateBetaModifier', () => {
  it('returns 1.2 for low coverage', () => {
    expect(calculateBetaModifier(0)).toBe(1.2);
    expect(calculateBetaModifier(0.1)).toBe(1.2);
    expect(calculateBetaModifier(0.29)).toBe(1.2);
  });

  it('returns 1.0 for mid coverage', () => {
    expect(calculateBetaModifier(0.3)).toBe(1.0);
    expect(calculateBetaModifier(0.5)).toBe(1.0);
    expect(calculateBetaModifier(0.69)).toBe(1.0);
  });

  it('returns 0.9 for high coverage', () => {
    expect(calculateBetaModifier(0.7)).toBe(0.9);
    expect(calculateBetaModifier(0.8)).toBe(0.9);
    expect(calculateBetaModifier(1.0)).toBe(0.9);
  });

  it('uses custom thresholds', () => {
    const customConfig = {
      low: 1.5,
      mid: 1.0,
      high: 0.7,
      low_threshold: 0.2,
      high_threshold: 0.8,
    };

    expect(calculateBetaModifier(0.1, customConfig)).toBe(1.5);
    expect(calculateBetaModifier(0.5, customConfig)).toBe(1.0);
    expect(calculateBetaModifier(0.9, customConfig)).toBe(0.7);
  });
});

// =============================================================================
// Estimated Accuracy Blend Tests
// =============================================================================

describe('calculateEstimatedAccuracy', () => {
  it('uses only overall accuracy for < 5 recent', () => {
    expect(calculateEstimatedAccuracy(0.9, 0.6, 0)).toBe(0.6);
    expect(calculateEstimatedAccuracy(0.9, 0.6, 4)).toBe(0.6);
  });

  it('uses only recent accuracy for >= 20 recent', () => {
    expect(calculateEstimatedAccuracy(0.9, 0.6, 20)).toBe(0.9);
    expect(calculateEstimatedAccuracy(0.9, 0.6, 100)).toBe(0.9);
  });

  it('blends proportionally for 5-19 recent', () => {
    // At 10 recent: alpha = 10/20 = 0.5
    // Blend = 0.5 * 0.9 + 0.5 * 0.6 = 0.75
    expect(calculateEstimatedAccuracy(0.9, 0.6, 10)).toBeCloseTo(0.75, 5);

    // At 15 recent: alpha = 15/20 = 0.75
    // Blend = 0.75 * 0.9 + 0.25 * 0.6 = 0.825
    expect(calculateEstimatedAccuracy(0.9, 0.6, 15)).toBeCloseTo(0.825, 5);
  });

  it('handles edge case at exactly 5', () => {
    // alpha = 5/20 = 0.25
    // Blend = 0.25 * 0.8 + 0.75 * 0.5 = 0.575
    expect(calculateEstimatedAccuracy(0.8, 0.5, 5)).toBeCloseTo(0.575, 5);
  });
});

// =============================================================================
// Expected Score Tests
// =============================================================================

describe('calculateExpectedScore', () => {
  it('returns weight times accuracy', () => {
    expect(calculateExpectedScore(6, 0.8)).toBeCloseTo(4.8, 5);
    expect(calculateExpectedScore(4, 0.5)).toBe(2);
    expect(calculateExpectedScore(3, 1.0)).toBe(3);
  });

  it('returns 0 for 0 accuracy', () => {
    expect(calculateExpectedScore(6, 0)).toBe(0);
  });

  it('returns full weight for perfect accuracy', () => {
    expect(calculateExpectedScore(6, 1.0)).toBe(6);
  });
});

// =============================================================================
// Risk Score Tests
// =============================================================================

describe('calculateRiskScore', () => {
  it('calculates risk with beta modifier', () => {
    // Low coverage (beta = 1.2): risk = 6 * (1 - 0.8) * 1.2 = 1.44
    expect(calculateRiskScore(6, 0.8, 0.2)).toBeCloseTo(1.44, 5);

    // Mid coverage (beta = 1.0): risk = 6 * (1 - 0.8) * 1.0 = 1.2
    expect(calculateRiskScore(6, 0.8, 0.5)).toBeCloseTo(1.2, 5);

    // High coverage (beta = 0.9): risk = 6 * (1 - 0.8) * 0.9 = 1.08
    expect(calculateRiskScore(6, 0.8, 0.8)).toBeCloseTo(1.08, 5);
  });

  it('returns 0 for perfect accuracy', () => {
    expect(calculateRiskScore(6, 1.0, 0.5)).toBe(0);
  });

  it('returns max risk for 0 accuracy', () => {
    // weight * 1 * beta
    expect(calculateRiskScore(6, 0, 0.5)).toBe(6); // beta = 1.0
  });
});

// =============================================================================
// Expected Questions Lost Tests
// =============================================================================

describe('calculateExpectedQuestionsLost', () => {
  it('calculates questions lost', () => {
    expect(calculateExpectedQuestionsLost(6, 0.8)).toBeCloseTo(1.2, 5);
    expect(calculateExpectedQuestionsLost(4, 0.5)).toBe(2);
  });

  it('returns 0 for perfect accuracy', () => {
    expect(calculateExpectedQuestionsLost(6, 1.0)).toBe(0);
  });

  it('returns full weight for 0 accuracy', () => {
    expect(calculateExpectedQuestionsLost(6, 0)).toBe(6);
  });
});

// =============================================================================
// Priority Score Tests
// =============================================================================

describe('calculatePriorityScore', () => {
  it('reduces priority with high mastery', () => {
    const riskScore = 2.0;

    // 0 mastery: priority = risk
    expect(calculatePriorityScore(riskScore, 0)).toBe(2.0);

    // 0.5 mastery: priority = risk * 0.5
    expect(calculatePriorityScore(riskScore, 0.5)).toBe(1.0);

    // 1.0 mastery: priority = 0
    expect(calculatePriorityScore(riskScore, 1.0)).toBe(0);
  });

  it('returns 0 for 0 risk', () => {
    expect(calculatePriorityScore(0, 0.5)).toBe(0);
  });
});

// =============================================================================
// Accuracy Trend Tests
// =============================================================================

describe('calculateAccuracyTrend', () => {
  it('returns positive for improvement', () => {
    expect(calculateAccuracyTrend(0.8, 0.6)).toBeCloseTo(0.2, 5);
  });

  it('returns negative for decline', () => {
    expect(calculateAccuracyTrend(0.6, 0.8)).toBeCloseTo(-0.2, 5);
  });

  it('returns 0 for no change', () => {
    expect(calculateAccuracyTrend(0.7, 0.7)).toBe(0);
  });
});

// =============================================================================
// Complex Scenario Tests
// =============================================================================

describe('Complex Scenarios', () => {
  it('calculates realistic student progression', () => {
    // Beginner student
    const beginnerScore = calculateReadinessScore(0.5, 0.45, 0.2, 0.1, 0, 2, 2);
    expect(beginnerScore).toBeLessThan(40);

    // Intermediate student
    const intermediateScore = calculateReadinessScore(0.7, 0.65, 0.5, 0.35, 1, 3, 1);
    expect(intermediateScore).toBeGreaterThan(40);
    expect(intermediateScore).toBeLessThan(70);

    // Advanced student
    const advancedScore = calculateReadinessScore(0.85, 0.8, 0.75, 0.6, 3, 4, 0);
    expect(advancedScore).toBeGreaterThan(70);
  });

  it('handles exam-ready student', () => {
    const score = calculateReadinessScore(0.9, 0.85, 0.9, 0.75, 4, 5, 0);
    const prob = calculatePassProbability(score);

    expect(score).toBeGreaterThan(80);
    expect(prob).toBeGreaterThan(0.85);
  });

  it('penalizes rusty student appropriately', () => {
    // Good stats but 20 days since study
    const freshScore = calculateReadinessScore(0.85, 0.8, 0.7, 0.6, 3, 4, 0);
    const rustyScore = calculateReadinessScore(0.85, 0.8, 0.7, 0.6, 3, 4, 20);

    expect(rustyScore).toBe(freshScore - 10); // max penalty
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('handles all zeros gracefully', () => {
    expect(() => calculateReadinessScore(0, 0, 0, 0, 0, 0, 0)).not.toThrow();
    expect(calculateReadinessScore(0, 0, 0, 0, 0, 0, 0)).toBe(0);
  });

  it('handles all ones gracefully', () => {
    expect(() => calculateReadinessScore(1, 1, 1, 1, 100, 100, 0)).not.toThrow();
    expect(calculateReadinessScore(1, 1, 1, 1, 100, 100, 0)).toBe(100);
  });

  it('handles negative days (edge case)', () => {
    // Negative days should result in negative penalty (bonus)
    expect(calculateRecencyPenalty(-5)).toBe(-2.5);
  });

  it('handles very large values', () => {
    const prob = calculatePassProbability(1000);
    expect(prob).toBeCloseTo(1.0, 5);

    const negProb = calculatePassProbability(-1000);
    expect(negProb).toBeCloseTo(0.0, 5);
  });
});

// =============================================================================
// Wilson Score Confidence Interval Tests
// =============================================================================

describe('wilsonScoreInterval', () => {
  it('returns [0, 1] for n=0', () => {
    const [lower, upper] = wilsonScoreInterval(0.5, 0);
    expect(lower).toBe(0);
    expect(upper).toBe(1);
  });

  it('narrows interval with more samples', () => {
    const [lower10, upper10] = wilsonScoreInterval(0.7, 10);
    const [lower100, upper100] = wilsonScoreInterval(0.7, 100);

    expect(upper10 - lower10).toBeGreaterThan(upper100 - lower100);
  });

  it('centers around observed accuracy', () => {
    const [lower, upper] = wilsonScoreInterval(0.8, 100);

    expect((lower + upper) / 2).toBeCloseTo(0.8, 1);
  });

  it('bounds are always in [0, 1]', () => {
    const [lower1, upper1] = wilsonScoreInterval(0.01, 100);
    const [lower2, upper2] = wilsonScoreInterval(0.99, 100);

    expect(lower1).toBeGreaterThanOrEqual(0);
    expect(upper1).toBeLessThanOrEqual(1);
    expect(lower2).toBeGreaterThanOrEqual(0);
    expect(upper2).toBeLessThanOrEqual(1);
  });

  it('uses custom z-score', () => {
    // z=1.96 for 95% CI, z=2.576 for 99% CI
    const [lower95, upper95] = wilsonScoreInterval(0.7, 50, 1.96);
    const [lower99, upper99] = wilsonScoreInterval(0.7, 50, 2.576);

    // 99% CI should be wider
    expect(upper99 - lower99).toBeGreaterThan(upper95 - lower95);
  });
});

// =============================================================================
// Exam Structure Validation Tests
// =============================================================================

describe('Exam Structure Constants', () => {
  describe('TECHNICIAN_SUBELEMENTS', () => {
    it('has correct total exam questions', () => {
      const total = Object.values(TECHNICIAN_SUBELEMENTS).reduce(
        (sum, sub) => sum + sub.examQuestions,
        0
      );
      expect(total).toBe(35);
    });

    it('has correct subelement count', () => {
      expect(Object.keys(TECHNICIAN_SUBELEMENTS)).toHaveLength(10);
    });

    it('has all required subelements', () => {
      const expected = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T0'];
      expect(Object.keys(TECHNICIAN_SUBELEMENTS).sort()).toEqual(expected.sort());
    });
  });

  describe('GENERAL_SUBELEMENTS', () => {
    it('has correct total exam questions', () => {
      const total = Object.values(GENERAL_SUBELEMENTS).reduce(
        (sum, sub) => sum + sub.examQuestions,
        0
      );
      expect(total).toBe(35);
    });

    it('has correct subelement count', () => {
      expect(Object.keys(GENERAL_SUBELEMENTS)).toHaveLength(10);
    });
  });

  describe('EXTRA_SUBELEMENTS', () => {
    it('has correct total exam questions', () => {
      const total = Object.values(EXTRA_SUBELEMENTS).reduce(
        (sum, sub) => sum + sub.examQuestions,
        0
      );
      expect(total).toBe(50);
    });

    it('has correct subelement count', () => {
      expect(Object.keys(EXTRA_SUBELEMENTS)).toHaveLength(10);
    });
  });

  describe('EXAM_PASSING_SCORES', () => {
    it('has correct passing thresholds', () => {
      expect(EXAM_PASSING_SCORES.technician.passing).toBe(26);
      expect(EXAM_PASSING_SCORES.general.passing).toBe(26);
      expect(EXAM_PASSING_SCORES.extra.passing).toBe(37);
    });

    it('passing score is ~74% of total', () => {
      const techPercent = EXAM_PASSING_SCORES.technician.passing / EXAM_PASSING_SCORES.technician.total;
      const generalPercent = EXAM_PASSING_SCORES.general.passing / EXAM_PASSING_SCORES.general.total;
      const extraPercent = EXAM_PASSING_SCORES.extra.passing / EXAM_PASSING_SCORES.extra.total;

      expect(techPercent).toBeCloseTo(0.74, 1);
      expect(generalPercent).toBeCloseTo(0.74, 1);
      expect(extraPercent).toBeCloseTo(0.74, 1);
    });
  });
});

// =============================================================================
// Default Config Validation
// =============================================================================

describe('DEFAULT_CONFIG', () => {
  it('has weights that sum to 100', () => {
    const weights = DEFAULT_CONFIG.formula_weights;
    const sum =
      weights.recent_accuracy +
      weights.overall_accuracy +
      weights.coverage +
      weights.mastery +
      weights.test_rate;
    expect(sum).toBe(100);
  });

  it('has valid pass probability parameters', () => {
    expect(DEFAULT_CONFIG.pass_probability.k).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.pass_probability.r0).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.pass_probability.r0).toBeLessThan(100);
  });

  it('has valid recency penalty parameters', () => {
    expect(DEFAULT_CONFIG.recency_penalty.max_penalty).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.recency_penalty.decay_rate).toBeGreaterThan(0);
  });

  it('has valid coverage beta thresholds', () => {
    expect(DEFAULT_CONFIG.coverage_beta.low_threshold).toBeLessThan(
      DEFAULT_CONFIG.coverage_beta.high_threshold
    );
    expect(DEFAULT_CONFIG.coverage_beta.low_threshold).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_CONFIG.coverage_beta.high_threshold).toBeLessThanOrEqual(1);
  });
});
