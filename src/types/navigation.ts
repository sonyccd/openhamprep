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
  | 'find-test-site';

export type TestType = 'technician' | 'general' | 'extra';

export const testTypes = [
  { id: 'technician' as TestType, name: 'Technician', available: true },
  { id: 'general' as TestType, name: 'General', available: false },
  { id: 'extra' as TestType, name: 'Amateur Extra', available: false },
];
