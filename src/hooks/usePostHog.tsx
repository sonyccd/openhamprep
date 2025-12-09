import { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import posthog from 'posthog-js';
import { useAuth } from './useAuth';

const POSTHOG_KEY = 'phc_dADgppY50Dyh9adNuDYcGFoJ9JwaAubQMOagrqAMbv5';
const POSTHOG_HOST = 'https://us.i.posthog.com';

interface PostHogContextType {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  isReady: boolean;
}

const PostHogContext = createContext<PostHogContextType | undefined>(undefined);

let isInitialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize and track when user is authenticated
    if (user?.email) {
      if (!isInitialized) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          capture_exceptions: true,
        });
        isInitialized = true;
      }

      // Identify user by email
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.display_name || user.email,
      });
    } else if (isInitialized) {
      // Reset when user logs out
      posthog.reset();
    }
  }, [user]);

  const capture = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (user && isInitialized) {
      posthog.capture(event, properties);
    }
  }, [user]);

  return (
    <PostHogContext.Provider value={{ capture, isReady: !!user && isInitialized }}>
      {children}
    </PostHogContext.Provider>
  );
}

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
}

// Pre-defined event names for consistency
export const ANALYTICS_EVENTS = {
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
