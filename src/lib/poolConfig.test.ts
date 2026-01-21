import { describe, it, expect } from 'vitest';
import {
  POOL_CONFIG,
  getPoolVersionForExamType,
  getPoolConfig,
  isCurrentPool,
  type ExamType
} from './poolConfig';

describe('poolConfig', () => {
  describe('POOL_CONFIG', () => {
    it('has configuration for all three exam types', () => {
      expect(POOL_CONFIG.technician).toBeDefined();
      expect(POOL_CONFIG.general).toBeDefined();
      expect(POOL_CONFIG.extra).toBeDefined();
    });

    it('has correct pool versions', () => {
      expect(POOL_CONFIG.technician.currentVersion).toBe('2022-2026');
      expect(POOL_CONFIG.general.currentVersion).toBe('2023-2027');
      expect(POOL_CONFIG.extra.currentVersion).toBe('2024-2028');
    });

    it('has 74% passing threshold for all exams', () => {
      expect(POOL_CONFIG.technician.passingThreshold).toBe(0.74);
      expect(POOL_CONFIG.general.passingThreshold).toBe(0.74);
      expect(POOL_CONFIG.extra.passingThreshold).toBe(0.74);
    });

    it('has question counts for each exam type', () => {
      expect(POOL_CONFIG.technician.questionCount).toBe(411);
      expect(POOL_CONFIG.general.questionCount).toBe(456);
      expect(POOL_CONFIG.extra.questionCount).toBe(622);
    });

    it('has effective and expiration dates', () => {
      expect(POOL_CONFIG.technician.effectiveDate).toBe('2022-07-01');
      expect(POOL_CONFIG.technician.expirationDate).toBe('2026-06-30');
    });
  });

  describe('getPoolVersionForExamType', () => {
    it('returns correct version for technician', () => {
      expect(getPoolVersionForExamType('technician')).toBe('2022-2026');
    });

    it('returns correct version for general', () => {
      expect(getPoolVersionForExamType('general')).toBe('2023-2027');
    });

    it('returns correct version for extra', () => {
      expect(getPoolVersionForExamType('extra')).toBe('2024-2028');
    });
  });

  describe('getPoolConfig', () => {
    it('returns full config object for technician', () => {
      const config = getPoolConfig('technician');
      expect(config.currentVersion).toBe('2022-2026');
      expect(config.passingThreshold).toBe(0.74);
      expect(config.questionCount).toBe(411);
    });

    it('returns full config object for general', () => {
      const config = getPoolConfig('general');
      expect(config.currentVersion).toBe('2023-2027');
      expect(config.passingThreshold).toBe(0.74);
      expect(config.questionCount).toBe(456);
    });

    it('returns full config object for extra', () => {
      const config = getPoolConfig('extra');
      expect(config.currentVersion).toBe('2024-2028');
      expect(config.passingThreshold).toBe(0.74);
      expect(config.questionCount).toBe(622);
    });
  });

  describe('isCurrentPool', () => {
    it('returns true for current technician pool', () => {
      expect(isCurrentPool('technician', '2022-2026')).toBe(true);
    });

    it('returns false for old technician pool', () => {
      expect(isCurrentPool('technician', '2018-2022')).toBe(false);
    });

    it('returns true for current general pool', () => {
      expect(isCurrentPool('general', '2023-2027')).toBe(true);
    });

    it('returns false for old general pool', () => {
      expect(isCurrentPool('general', '2019-2023')).toBe(false);
    });

    it('returns true for current extra pool', () => {
      expect(isCurrentPool('extra', '2024-2028')).toBe(true);
    });

    it('returns false for mismatched pool versions', () => {
      // Wrong version for exam type
      expect(isCurrentPool('technician', '2023-2027')).toBe(false);
      expect(isCurrentPool('general', '2022-2026')).toBe(false);
    });
  });
});
