import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppTour } from './useAppTour';

// Mock Shepherd.js
vi.mock('shepherd.js', () => {
  const mockTour = {
    addStep: vi.fn(),
    start: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    next: vi.fn(),
    back: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    default: {
      Tour: vi.fn(() => mockTour),
    },
  };
});

// Mock the CSS import
vi.mock('shepherd.js/dist/css/shepherd.css', () => ({}));

// Store original window.innerWidth
const originalInnerWidth = window.innerWidth;

describe('useAppTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default to desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore original innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Initialization', () => {
    it('should return tour object and control functions', () => {
      const { result } = renderHook(() => useAppTour());

      expect(result.current.tour).toBeDefined();
      expect(result.current.startTour).toBeDefined();
      expect(result.current.cancelTour).toBeDefined();
      expect(typeof result.current.startTour).toBe('function');
      expect(typeof result.current.cancelTour).toBe('function');
    });

    it('should create tour with correct default options', async () => {
      const Shepherd = await import('shepherd.js');

      renderHook(() => useAppTour());

      expect(Shepherd.default.Tour).toHaveBeenCalledWith(
        expect.objectContaining({
          useModalOverlay: true,
          defaultStepOptions: expect.objectContaining({
            classes: 'shepherd-theme-custom',
            scrollTo: expect.objectContaining({
              behavior: 'smooth',
              block: 'center',
            }),
            cancelIcon: expect.objectContaining({
              enabled: true,
            }),
          }),
        })
      );
    });

    it('should add all tour steps on desktop', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      // Should add 10 steps on desktop (dashboard, license-selector, practice-test, random-practice,
      // study-by-topic, weak-areas, glossary, find-test-site, forum, complete)
      expect(mockTour.addStep).toHaveBeenCalledTimes(10);
    });

    it('should add all tour steps on mobile without attachment (centered modals)', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      mockTour.addStep.mockClear();

      renderHook(() => useAppTour());

      // Should add all 10 steps on mobile
      expect(mockTour.addStep).toHaveBeenCalledTimes(10);

      // On mobile, steps should NOT have attachTo (centered modals instead)
      const licenseCall = mockTour.addStep.mock.calls[1][0];
      expect(licenseCall.id).toBe('license-selector');
      expect(licenseCall.attachTo).toBeUndefined();
    });
  });

  describe('Tour Steps', () => {
    it('should add dashboard step without attachment (centered)', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      // First step should be dashboard
      const dashboardCall = mockTour.addStep.mock.calls[0][0];
      expect(dashboardCall.id).toBe('dashboard');
      expect(dashboardCall.title).toBe('Welcome to Open Ham Prep!');
      expect(dashboardCall.attachTo).toBeUndefined(); // Centered, no attachment
    });

    it('should add license selector step with right attachment', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      const licenseCall = mockTour.addStep.mock.calls[1][0];
      expect(licenseCall.id).toBe('license-selector');
      expect(licenseCall.attachTo).toEqual({
        element: '[data-tour="license-selector"]',
        on: 'right',
      });
    });

    it('should add forum step', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      const forumCall = mockTour.addStep.mock.calls[8][0];
      expect(forumCall.id).toBe('forum');
      expect(forumCall.title).toBe('Join Our Community');
      expect(forumCall.attachTo).toEqual({
        element: '[data-tour="forum"]',
        on: 'right',
      });
    });

    it('should add completion step as last step', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      const completeCall = mockTour.addStep.mock.calls[9][0];
      expect(completeCall.id).toBe('complete');
      expect(completeCall.title).toBe("You're All Set!");
    });

    it('should include only Next button on first step (cancel via X icon)', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      const dashboardCall = mockTour.addStep.mock.calls[0][0];
      // First step should only have Next button, cancel is via the X icon
      expect(dashboardCall.buttons.length).toBe(1);
      expect(dashboardCall.buttons[0].text).toBe('Next');
    });

    it('should include Back and Next buttons on middle steps', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      // Check a middle step (e.g., practice-test which is index 2)
      const practiceCall = mockTour.addStep.mock.calls[2][0];
      const backButton = practiceCall.buttons.find(b => b.text === 'Back');
      const nextButton = practiceCall.buttons.find(b => b.text === 'Next');

      expect(backButton).toBeDefined();
      expect(nextButton).toBeDefined();
    });
  });

  describe('startTour', () => {
    it('should call tour.start after a delay', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.startTour();
      });

      // Tour should not be started immediately
      expect(mockTour.start).not.toHaveBeenCalled();

      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockTour.start).toHaveBeenCalled();
    });
  });

  describe('cancelTour', () => {
    it('should call tour.cancel', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      const { result } = renderHook(() => useAppTour());

      act(() => {
        result.current.cancelTour();
      });

      expect(mockTour.cancel).toHaveBeenCalled();
    });
  });

  describe('Event Callbacks', () => {
    it('should register onComplete callback', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onComplete = vi.fn();

      renderHook(() => useAppTour({ onComplete }));

      expect(mockTour.on).toHaveBeenCalledWith('complete', onComplete);
    });

    it('should register onCancel callback', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onCancel = vi.fn();

      renderHook(() => useAppTour({ onCancel }));

      expect(mockTour.on).toHaveBeenCalledWith('cancel', onCancel);
    });

    it('should unregister callbacks on unmount', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      const { unmount } = renderHook(() => useAppTour({ onComplete, onCancel }));

      unmount();

      expect(mockTour.off).toHaveBeenCalledWith('complete', onComplete);
      expect(mockTour.off).toHaveBeenCalledWith('cancel', onCancel);
    });

    it('should not register callbacks if not provided', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      // on should not be called with undefined callbacks
      const onCalls = mockTour.on.mock.calls;
      onCalls.forEach(call => {
        expect(call[1]).not.toBeUndefined();
      });
    });
  });

  describe('Tour Memoization', () => {
    it('should return the same tour instance on re-renders', () => {
      const { result, rerender } = renderHook(() => useAppTour());

      const firstTour = result.current.tour;

      rerender();

      expect(result.current.tour).toBe(firstTour);
    });
  });

  describe('Mobile Menu Integration', () => {
    it('should call onOpenMobileMenu callback on mobile when advancing from first step', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      mockTour.addStep.mockClear();

      const onOpenMobileMenu = vi.fn();
      renderHook(() => useAppTour({ onOpenMobileMenu }));

      // Get the first step (dashboard) and simulate clicking Next
      const dashboardCall = mockTour.addStep.mock.calls[0][0];
      expect(dashboardCall.id).toBe('dashboard');

      // The action function should call onOpenMobileMenu on mobile
      dashboardCall.buttons[0].action();

      expect(onOpenMobileMenu).toHaveBeenCalled();
    });

    it('should NOT call onOpenMobileMenu callback on desktop when advancing from first step', async () => {
      // Ensure desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      mockTour.addStep.mockClear();

      const onOpenMobileMenu = vi.fn();
      renderHook(() => useAppTour({ onOpenMobileMenu }));

      // Get the first step (dashboard) and simulate clicking Next
      const dashboardCall = mockTour.addStep.mock.calls[0][0];
      dashboardCall.buttons[0].action();

      expect(onOpenMobileMenu).not.toHaveBeenCalled();
    });
  });
});
