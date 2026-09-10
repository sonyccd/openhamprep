import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { MotionGlobalConfig } from 'framer-motion';

// Skip framer-motion's WAAPI-accelerated animations in tests. Without this,
// happy-dom's Animation.cancel() rejects the animation's "finished" promise
// when a motion component unmounts mid-animation, and framer-motion doesn't
// catch it - producing an unhandled rejection that fails the test run even
// though every assertion passes.
MotionGlobalConfig.skipAnimations = true;

// Belt and suspenders: framer-motion feature-detects WAAPI support once per
// module instance (memoized) via `Object.hasOwnProperty(Element.prototype,
// "animate")`. When AnimatePresence exit/enter cycles run during a test
// (e.g. clicking through a flashcard), it still routes through the real
// WAAPI path even with skipAnimations set, hitting the same unhandled
// rejection on unmount. Hiding Element.prototype.animate makes framer-motion
// fall back to its own main-thread animation driver instead.
delete (Element.prototype as { animate?: unknown }).animate;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
// Must be a real class (not an arrow-function mock) so `new ResizeObserver()`
// works - consumers like cmdk/Radix construct it directly.
global.ResizeObserver = class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof IntersectionObserver;

// Mock Pendo - PendoProvider only initializes user identity, no manual tracking needed
vi.mock('@/hooks/usePendo', () => ({
  PendoProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Amplitude - AmplitudeProvider only syncs user identity, SDK init is in main.tsx
vi.mock('@/hooks/useAmplitude', () => ({
  AmplitudeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Amplitude tracking utility - all tracking functions are no-ops in tests
vi.mock('@/lib/amplitude', () => ({
  trackSignUp: vi.fn(),
  trackSignIn: vi.fn(),
  trackSignOut: vi.fn(),
  trackPracticeTestStarted: vi.fn(),
  trackPracticeTestCompleted: vi.fn(),
  trackQuestionAnswered: vi.fn(),
  trackQuizStarted: vi.fn(),
  trackQuizCompleted: vi.fn(),
  trackLicenseTypeChanged: vi.fn(),
  trackStudyModeSelected: vi.fn(),
  trackBookmarkAdded: vi.fn(),
  trackBookmarkRemoved: vi.fn(),
  trackTopicViewed: vi.fn(),
  trackLessonViewed: vi.fn(),
  trackGlossarySearched: vi.fn(),
  trackAiPromptCopied: vi.fn(),
}));
