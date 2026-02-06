import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
}));
