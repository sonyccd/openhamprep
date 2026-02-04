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
