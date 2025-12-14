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
    it('should register complete event handler', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onComplete = vi.fn();

      renderHook(() => useAppTour({ onComplete }));

      // Verify complete handler is registered
      expect(mockTour.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    it('should call onComplete when tour complete event fires', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onComplete = vi.fn();

      renderHook(() => useAppTour({ onComplete }));

      // Find the registered complete handler and call it
      const completeCall = mockTour.on.mock.calls.find(call => call[0] === 'complete');
      expect(completeCall).toBeDefined();
      completeCall![1](); // Trigger the handler

      expect(onComplete).toHaveBeenCalled();
    });

    it('should register cancel event handler', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onCancel = vi.fn();

      renderHook(() => useAppTour({ onCancel }));

      // Verify cancel handler is registered
      expect(mockTour.on).toHaveBeenCalledWith('cancel', expect.any(Function));
    });

    it('should call onCancel when tour cancel event fires', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onCancel = vi.fn();

      renderHook(() => useAppTour({ onCancel }));

      // Find the registered cancel handler and call it
      const cancelCall = mockTour.on.mock.calls.find(call => call[0] === 'cancel');
      expect(cancelCall).toBeDefined();
      cancelCall![1](); // Trigger the handler

      expect(onCancel).toHaveBeenCalled();
    });

    it('should unregister callbacks on unmount', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      const { unmount } = renderHook(() => useAppTour({ onComplete, onCancel }));

      unmount();

      // Should unregister both handlers
      expect(mockTour.off).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(mockTour.off).toHaveBeenCalledWith('cancel', expect.any(Function));
    });

    it('should always register event handlers (they safely handle undefined callbacks)', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();

      renderHook(() => useAppTour());

      // Event handlers are always registered (they use refs internally)
      expect(mockTour.on).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(mockTour.on).toHaveBeenCalledWith('cancel', expect.any(Function));
    });

    it('should call updated callback when callback changes', async () => {
      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      const onCancel1 = vi.fn();
      const onCancel2 = vi.fn();

      const { rerender } = renderHook(
        ({ onCancel }) => useAppTour({ onCancel }),
        { initialProps: { onCancel: onCancel1 } }
      );

      // Rerender with new callback
      rerender({ onCancel: onCancel2 });

      // Find and trigger the cancel handler
      const cancelCall = mockTour.on.mock.calls.find(call => call[0] === 'cancel');
      cancelCall![1](); // Trigger the handler

      // Should call the NEW callback (onCancel2), not the old one
      expect(onCancel1).not.toHaveBeenCalled();
      expect(onCancel2).toHaveBeenCalled();
    });
  });

  describe('Tour Memoization', () => {
    it('should return the same tour instance on re-renders', () => {
      const { result, rerender } = renderHook(() => useAppTour());

      const firstTour = result.current.tour;

      rerender();

      expect(result.current.tour).toBe(firstTour);
    });

    it('should NOT recreate tour when callbacks change', async () => {
      const Shepherd = await import('shepherd.js');

      const onCancel1 = vi.fn();
      const onCancel2 = vi.fn();
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onCancel, onComplete }) => useAppTour({ onCancel, onComplete }),
        { initialProps: { onCancel: onCancel1, onComplete: onComplete1 } }
      );

      const firstTour = result.current.tour;

      // Rerender with different callbacks
      rerender({ onCancel: onCancel2, onComplete: onComplete2 });

      // Tour instance should be the same (not recreated)
      expect(result.current.tour).toBe(firstTour);

      // Tour constructor should only have been called once
      expect(Shepherd.default.Tour).toHaveBeenCalledTimes(1);
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

    it('should call updated onOpenMobileMenu when callback changes', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const Shepherd = await import('shepherd.js');
      const mockTour = new Shepherd.default.Tour();
      mockTour.addStep.mockClear();

      const onOpenMobileMenu1 = vi.fn();
      const onOpenMobileMenu2 = vi.fn();

      const { rerender } = renderHook(
        ({ onOpenMobileMenu }) => useAppTour({ onOpenMobileMenu }),
        { initialProps: { onOpenMobileMenu: onOpenMobileMenu1 } }
      );

      // Rerender with new callback
      rerender({ onOpenMobileMenu: onOpenMobileMenu2 });

      // Get the first step (dashboard) and simulate clicking Next
      const dashboardCall = mockTour.addStep.mock.calls[0][0];
      dashboardCall.buttons[0].action();

      // Should call the NEW callback, not the old one
      expect(onOpenMobileMenu1).not.toHaveBeenCalled();
      expect(onOpenMobileMenu2).toHaveBeenCalled();
    });
  });
});
