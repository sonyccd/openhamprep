import { describe, it, expect } from 'vitest';
import { buildAiPrompt, getLicenseClass, AiPromptData } from './aiPrompt';

const baseData: AiPromptData = {
  questionText: 'What is the purpose of the Amateur Radio Service?',
  options: {
    A: 'To provide emergency communications',
    B: 'To make money',
    C: 'To broadcast music',
    D: 'To replace cell phones',
  },
  userAnswer: 'B',
  correctAnswer: 'A',
  explanation: 'Amateur radio is for emergency communications and experimentation.',
  licenseClass: 'Technician',
  subelement: 'T1',
  questionId: 'T1A01',
};

describe('getLicenseClass', () => {
  it('maps T to Technician', () => {
    expect(getLicenseClass('T1A01')).toBe('Technician');
  });

  it('maps G to General', () => {
    expect(getLicenseClass('G2B03')).toBe('General');
  });

  it('maps E to Extra', () => {
    expect(getLicenseClass('E1A01')).toBe('Extra');
  });

  it('falls back to Amateur Radio for unknown prefix', () => {
    expect(getLicenseClass('X1A01')).toBe('Amateur Radio');
  });
});

describe('buildAiPrompt', () => {
  describe('wrong answer', () => {
    it('includes question text', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain(baseData.questionText);
    });

    it('includes all four options', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('A) To provide emergency communications');
      expect(prompt).toContain('B) To make money');
      expect(prompt).toContain('C) To broadcast music');
      expect(prompt).toContain('D) To replace cell phones');
    });

    it('includes correct and user answer', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('**Correct answer:** A) To provide emergency communications');
      expect(prompt).toContain('**My answer:** B) To make money');
    });

    it('includes license class and subelement', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('Technician class US Amateur Radio license exam');
      expect(prompt).toContain('Subelement T1');
    });

    it('includes question ID', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('Question T1A01');
    });

    it('includes explanation when present', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('Amateur radio is for emergency communications and experimentation.');
    });

    it('asks why user answer is incorrect', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('Explain why my answer (B) is incorrect');
      expect(prompt).toContain('Explain why the correct answer (A) is right');
    });

    it('mentions the user chose wrong answer', () => {
      const prompt = buildAiPrompt(baseData);
      expect(prompt).toContain('I chose B) but the correct answer is A)');
    });
  });

  describe('correct answer', () => {
    const correctData: AiPromptData = {
      ...baseData,
      userAnswer: 'A',
    };

    it('asks to deepen understanding', () => {
      const prompt = buildAiPrompt(correctData);
      expect(prompt).toContain('I got this right');
      expect(prompt).toContain('truly understand the concept');
    });

    it('asks why other options are incorrect', () => {
      const prompt = buildAiPrompt(correctData);
      expect(prompt).toContain('Explain why the other options are incorrect');
    });

    it('does not contain wrong-answer framing', () => {
      const prompt = buildAiPrompt(correctData);
      expect(prompt).not.toContain('Explain why my answer');
      expect(prompt).not.toContain('I chose');
    });
  });

  describe('null explanation', () => {
    it('omits explanation section when null', () => {
      const data: AiPromptData = { ...baseData, explanation: null };
      const prompt = buildAiPrompt(data);
      expect(prompt).not.toContain('Explanation from study guide');
    });
  });

  describe('no user-identifying info', () => {
    it('contains no PII markers', () => {
      const prompt = buildAiPrompt(baseData);
      // Prompt should not reference user IDs, emails, etc.
      expect(prompt).not.toMatch(/user[_-]?id/i);
      expect(prompt).not.toMatch(/email/i);
      expect(prompt).not.toMatch(/password/i);
    });
  });
});
