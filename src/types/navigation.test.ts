import { describe, it, expect } from 'vitest';
import { testConfig, testTypes, TestType } from './navigation';

describe('navigation types', () => {
  describe('testConfig', () => {
    it('defines correct config for technician', () => {
      expect(testConfig.technician).toEqual({
        questionCount: 35,
        passingScore: 26,
      });
    });

    it('defines correct config for general', () => {
      expect(testConfig.general).toEqual({
        questionCount: 35,
        passingScore: 26,
      });
    });

    it('defines correct config for extra', () => {
      expect(testConfig.extra).toEqual({
        questionCount: 50,
        passingScore: 37,
      });
    });

    it('has 74% pass rate for all license types', () => {
      // Verify the pass rate math is correct for each type
      const types: TestType[] = ['technician', 'general', 'extra'];

      types.forEach(type => {
        const { questionCount, passingScore } = testConfig[type];
        const passRate = Math.round((passingScore / questionCount) * 100);
        // Should be approximately 74% (within rounding)
        expect(passRate).toBeGreaterThanOrEqual(74);
        expect(passRate).toBeLessThanOrEqual(75);
      });
    });

    it('extra has more questions than technician and general', () => {
      expect(testConfig.extra.questionCount).toBeGreaterThan(testConfig.technician.questionCount);
      expect(testConfig.extra.questionCount).toBeGreaterThan(testConfig.general.questionCount);
    });

    it('extra has higher passing score than technician and general', () => {
      expect(testConfig.extra.passingScore).toBeGreaterThan(testConfig.technician.passingScore);
      expect(testConfig.extra.passingScore).toBeGreaterThan(testConfig.general.passingScore);
    });
  });

  describe('testTypes', () => {
    it('includes all three license types', () => {
      const ids = testTypes.map(t => t.id);
      expect(ids).toContain('technician');
      expect(ids).toContain('general');
      expect(ids).toContain('extra');
    });

    it('all license types are available', () => {
      testTypes.forEach(type => {
        expect(type.available).toBe(true);
      });
    });

    it('has correct display names', () => {
      const technician = testTypes.find(t => t.id === 'technician');
      const general = testTypes.find(t => t.id === 'general');
      const extra = testTypes.find(t => t.id === 'extra');

      expect(technician?.name).toBe('Technician');
      expect(general?.name).toBe('General');
      expect(extra?.name).toBe('Amateur Extra');
    });
  });
});
