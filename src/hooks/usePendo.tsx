import { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './useAuth';

interface PendoContextType {
  track: (event: string, properties?: Record<string, unknown>) => void;
  isReady: boolean;
}

const PendoContext = createContext<PendoContextType | undefined>(undefined);

// Extend Window interface to include pendo
declare global {
  interface Window {
    pendo?: {
      initialize: (config: {
        visitor: {
          id: string;
          email?: string;
        };
        account?: {
          id: string;
        };
      }) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      isReady: () => boolean;
    };
  }
}

let isInitialized = false;

export function PendoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize and track when user is authenticated and pendo is loaded
    if (user?.email && window.pendo) {
      if (!isInitialized) {
        window.pendo.initialize({
          visitor: {
            id: user.id,
            email: user.email,
          },
        });
        isInitialized = true;
      }
    } else if (!user && isInitialized) {
      // Reset when user logs out
      isInitialized = false;
    }
  }, [user]);

  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (user && isInitialized && window.pendo) {
      window.pendo.track(event, properties);
    }
  }, [user]);

  return (
    <PendoContext.Provider value={{ track, isReady: !!user && isInitialized }}>
      {children}
    </PendoContext.Provider>
  );
}

export function usePendo() {
  const context = useContext(PendoContext);
  if (context === undefined) {
    throw new Error('usePendo must be used within a PendoProvider');
  }
  return context;
}

// Pre-defined event names for consistency (can reuse the same events as PostHog)
export const PENDO_EVENTS = {
  // Practice Tests
  PRACTICE_TEST_STARTED: 'practice_test_started',
  PRACTICE_TEST_COMPLETED: 'practice_test_completed',
  PRACTICE_TEST_PASSED: 'practice_test_passed',
  PRACTICE_TEST_FAILED: 'practice_test_failed',

  // Random Practice
  RANDOM_PRACTICE_STARTED: 'random_practice_started',
  QUESTION_ANSWERED: 'question_answered',
  STREAK_MILESTONE: 'streak_milestone_reached',
  NEW_BEST_STREAK: 'new_best_streak',

  // Subelement Practice
  SUBELEMENT_PRACTICE_STARTED: 'subelement_practice_started',
  TOPIC_SELECTED: 'topic_selected',

  // Bookmarks
  QUESTION_BOOKMARKED: 'question_bookmarked',
  BOOKMARK_REMOVED: 'bookmark_removed',
  BOOKMARKED_QUESTION_REVIEWED: 'bookmarked_question_reviewed',

  // Glossary
  FLASHCARD_SESSION_STARTED: 'flashcard_session_started',
  FLASHCARD_REVIEWED: 'flashcard_reviewed',
  TERM_MARKED_KNOWN: 'term_marked_known',
  TERM_MARKED_UNKNOWN: 'term_marked_unknown',

  // Calculator
  CALCULATOR_OPENED: 'calculator_opened',
  CALCULATOR_USED: 'calculator_used',

  // Weak Questions
  WEAK_QUESTIONS_REVIEWED: 'weak_questions_reviewed',

  // Test Review
  TEST_RESULT_REVIEWED: 'test_result_reviewed',
} as const;
