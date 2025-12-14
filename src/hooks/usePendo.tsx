import { createContext, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

// Use environment variable - gracefully disabled if not set
const PENDO_API_KEY = import.meta.env.VITE_PENDO_API_KEY || '';

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

// Track if Pendo script has been loaded (persists across component remounts)
let pendoScriptLoaded = false;
let loadingPromise: Promise<void> | null = null;

function loadPendoScript(apiKey: string): Promise<void> {
  // Return existing promise if already loading (prevents race conditions)
  if (loadingPromise) {
    return loadingPromise;
  }

  if (pendoScriptLoaded) {
    return Promise.resolve();
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Use the official Pendo snippet approach
    (function(p: Window, e: Document, n: string, d: string, o?: { _q?: unknown[] }) {
      o = p[d as keyof Window] = p[d as keyof Window] || {};
      (o as { _q: unknown[] })._q = (o as { _q: unknown[] })._q || [];
      const v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
      for (let w = 0, x = v.length; w < x; ++w) {
        (function(m) {
          (o as Record<string, unknown>)[m] = (o as Record<string, unknown>)[m] || function(...args: unknown[]) {
            ((o as { _q: unknown[] })._q)[m === v[0] ? 'unshift' : 'push']([m].concat(args));
          };
        })(v[w]);
      }
      const y = e.createElement(n) as HTMLScriptElement;
      y.async = true;
      y.src = 'https://cdn.pendo.io/agent/static/' + apiKey + '/pendo.js';
      y.onload = () => {
        pendoScriptLoaded = true;
        loadingPromise = null;
        resolve();
      };
      y.onerror = (error) => {
        loadingPromise = null;
        reject(error);
      };
      const z = e.getElementsByTagName(n)[0];
      z.parentNode?.insertBefore(y, z);
    })(window, document, 'script', 'pendo');
  });

  return loadingPromise;
}

export function PendoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Skip if Pendo key is not configured
    if (!PENDO_API_KEY) {
      return;
    }

    let isMounted = true;

    // Only initialize and track when user is authenticated
    if (user?.email) {
      loadPendoScript(PENDO_API_KEY)
        .then(() => {
          // Don't initialize if component unmounted during script load
          if (!isMounted) return;

          if (!isInitializedRef.current && window.pendo) {
            window.pendo.initialize({
              visitor: {
                id: user.id,
                email: user.email,
              },
            });
            isInitializedRef.current = true;
          }
        })
        .catch((error) => {
          if (!isMounted) return;
          console.warn('Failed to load Pendo:', error);
        });
    } else if (!user && isInitializedRef.current) {
      // Reset when user logs out
      isInitializedRef.current = false;
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (PENDO_API_KEY && user && isInitializedRef.current && window.pendo) {
      window.pendo.track(event, properties);
    }
  }, [user]);

  return (
    <PendoContext.Provider value={{ track, isReady: !!user && isInitializedRef.current }}>
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
