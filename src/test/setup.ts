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
// Note: this is global, so a component that calls element.animate(...)
// directly (not through framer-motion) will throw "animate is not a
// function" under test - if that ever happens, this is the first place
// to check.
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
//
// It also reports a non-zero size. jsdom gives every element a 0x0 box, and
// MUI X DataGrid measures its viewport through ResizeObserver before deciding
// how many rows to virtualise - at 0x0 it renders none, so every DataGrid test
// would see an empty table.
//
// IMPORTANT, because this is global and it changed behaviour: observe() used to
// be an inert vi.fn(). It now *synchronously invokes the callback* with a fixed
// 1024x768 rect, for every observer in every test file - not just DataGrid's.
// Any component that reacts to a resize will therefore see one fire during
// mount where previously nothing happened. Nothing in the suite asserts on that
// today, but if you are chasing a mysterious extra render or a state update on
// mount in an unrelated component, this mock is a plausible culprit.
const MOCK_VIEWPORT = { width: 1024, height: 768 };

global.ResizeObserver = class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe = (target: Element) => {
    const contentRect = {
      ...MOCK_VIEWPORT,
      top: 0,
      left: 0,
      bottom: MOCK_VIEWPORT.height,
      right: MOCK_VIEWPORT.width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRectReadOnly;

    this.callback(
      [{ target, contentRect } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  };

  unobserve = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof ResizeObserver;


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
