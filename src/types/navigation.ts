export type View =
  | 'dashboard'
  | 'practice-test'
  | 'random-practice'
  | 'weak-questions'
  | 'bookmarks'
  | 'subelement-practice'
  | 'chapter-practice'
  | 'review-test'
  | 'glossary'
  | 'glossary-flashcards'
  | 'find-test-site'
  | 'tools'
  | 'topics'
  | 'topic-detail'
  | 'lessons'
  | 'lesson-detail';

export type TestType = 'technician' | 'general' | 'extra';

// Test configuration per license type
// Technician and General: 35 questions, 26 to pass (74%)
// Extra: 50 questions, 37 to pass (74%)
export const testConfig: Record<TestType, { questionCount: number; passingScore: number }> = {
  technician: { questionCount: 35, passingScore: 26 },
  general: { questionCount: 35, passingScore: 26 },
  extra: { questionCount: 50, passingScore: 37 },
};

// NCVEC exam question distribution per subelement
// Each value represents the number of questions drawn from that subelement
export const examDistribution: Record<TestType, Record<string, number>> = {
  technician: { T1: 6, T2: 3, T3: 3, T4: 2, T5: 4, T6: 4, T7: 4, T8: 4, T9: 2, T0: 3 },
  general:    { G1: 5, G2: 5, G3: 3, G4: 5, G5: 3, G6: 2, G7: 3, G8: 3, G9: 4, G0: 2 },
  extra:      { E1: 6, E2: 5, E3: 3, E4: 5, E5: 4, E6: 6, E7: 8, E8: 4, E9: 8, E0: 1 },
};

export const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: true },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: true },
];

// Topic quiz configuration
// Users must score 80% or higher to complete a topic with associated questions
export const TOPIC_QUIZ_PASSING_THRESHOLD = 0.8;
