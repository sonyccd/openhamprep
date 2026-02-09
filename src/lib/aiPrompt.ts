/**
 * Builds a pre-formatted prompt that users can paste into any AI chatbot
 * (Claude, ChatGPT, Gemini, etc.) to get help understanding a ham radio
 * exam question.
 *
 * Pure function — no side effects, no API calls, no user-identifying info.
 */

export interface AiPromptData {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  userAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  licenseClass: string;
  subelement: string;
  questionId: string;
}

const LICENSE_CLASS_MAP: Record<string, string> = {
  T: 'Technician',
  G: 'General',
  E: 'Extra',
};

/** Derive full license class name from the first character of a question's displayName. */
export function getLicenseClass(displayName: string | undefined): string {
  if (!displayName) return 'Amateur Radio';
  return LICENSE_CLASS_MAP[displayName[0]] ?? 'Amateur Radio';
}

export function buildAiPrompt(data: AiPromptData): string {
  const isCorrect = data.userAnswer === data.correctAnswer;

  const lines: string[] = [
    `I'm studying for my ${data.licenseClass} class US Amateur Radio license exam and need help understanding this question.`,
    '',
    `**Question ${data.questionId}** (Subelement ${data.subelement}):`,
    data.questionText,
    '',
    `A) ${data.options.A}`,
    `B) ${data.options.B}`,
    `C) ${data.options.C}`,
    `D) ${data.options.D}`,
    '',
    `**Correct answer:** ${data.correctAnswer}) ${data.options[data.correctAnswer]}`,
    `**My answer:** ${data.userAnswer}) ${data.options[data.userAnswer]}`,
    '',
  ];

  if (data.explanation) {
    lines.push(`**Explanation from study guide:** ${data.explanation}`, '');
  }

  if (isCorrect) {
    lines.push(
      'I got this right, but I want to make sure I truly understand the concept rather than just memorizing the answer.',
      '',
      'Please:',
      '1. Explain the underlying concept in simple terms',
      '2. Explain why the other options are incorrect',
      '3. Share any practical tips or real-world applications related to this topic',
    );
  } else {
    lines.push(
      `I chose ${data.userAnswer}) but the correct answer is ${data.correctAnswer}).`,
      '',
      'Please:',
      `1. Explain why my answer (${data.userAnswer}) is incorrect`,
      `2. Explain why the correct answer (${data.correctAnswer}) is right`,
      '3. Explain the underlying concept in simple terms so I can understand it rather than just memorize it',
      '4. Share any practical tips or memory aids to help me remember this',
    );
  }

  lines.push('', 'Keep the explanation practical and relevant to amateur radio.');

  return lines.join('\n');
}
