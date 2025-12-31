export type View =
  | 'dashboard'
  | 'practice-test'
  | 'random-practice'
  | 'weak-questions'
  | 'bookmarks'
  | 'subelement-practice'
  | 'review-test'
  | 'glossary'
  | 'glossary-flashcards'
  | 'find-test-site'
  | 'topics'
  | 'topic-detail';

export type TestType = 'technician' | 'general' | 'extra';

// Test configuration per license type
// Technician and General: 35 questions, 26 to pass (74%)
// Extra: 50 questions, 37 to pass (74%)
export const testConfig: Record<TestType, { questionCount: number; passingScore: number }> = {
  technician: { questionCount: 35, passingScore: 26 },
  general: { questionCount: 35, passingScore: 26 },
  extra: { questionCount: 50, passingScore: 37 },
};

export const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: true },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: true },
];
