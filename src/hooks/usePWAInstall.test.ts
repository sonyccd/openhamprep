import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from './usePWAInstall';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
});

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();

    // Default matchMedia mock - not in standalone mode
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should start with showPrompt false before engagement delay', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.showPrompt).toBe(false);
    expect(result.current.hasEngaged).toBeUndefined(); // Internal state, exposed via showPrompt
  });

  it('should detect when already installed in standalone mode', () => {
    mockMatchMedia.mockReturnValue({
      matches: true, // Standalone mode
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should capture beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePWAInstall());

    // Initially canInstall is false (no event yet)
    expect(result.current.canInstall).toBe(false);

    // Simulate beforeinstallprompt event
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(true);
  });

  it('should show prompt after engagement delay when event is captured', () => {
    const { result } = renderHook(() => usePWAInstall());

    // Simulate beforeinstallprompt event
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    expect(result.current.showPrompt).toBe(false);

    // Fast-forward past engagement delay (30 seconds)
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.showPrompt).toBe(true);
  });

  it('should not show prompt if user previously dismissed', () => {
    // Set up dismissed state in localStorage
    localStorageMock.setItem('pwa_install_dismissed', 'true');

    const { result } = renderHook(() => usePWAInstall());

    // Simulate beforeinstallprompt event
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    // Fast-forward past engagement delay
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.showPrompt).toBe(false);
    expect(result.current.canInstall).toBe(false);
  });

  it('should save dismissal to localStorage when dismissPrompt is called', () => {
    const { result } = renderHook(() => usePWAInstall());

    // Simulate beforeinstallprompt event
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    act(() => {
      result.current.dismissPrompt();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa_install_dismissed',
      'true'
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa_install_outcome',
      'dismissed'
    );
    expect(result.current.canInstall).toBe(false);
  });

  it('should call native prompt when triggerInstall is called', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    await act(async () => {
      await result.current.triggerInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should save accepted outcome when user accepts install', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    await act(async () => {
      await result.current.triggerInstall();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa_install_outcome',
      'accepted'
    );
  });

  it('should save dismissed outcome when user dismisses native prompt', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    };

    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    await act(async () => {
      await result.current.triggerInstall();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa_install_dismissed',
      'true'
    );
  });

  it('should update isInstalled when appinstalled event fires', () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pwa_install_outcome',
      'accepted'
    );
  });

  it('should detect iOS devices', () => {
    // Save original userAgent
    const originalUserAgent = navigator.userAgent;

    // Mock iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isIOS).toBe(true);

    // Restore original
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });
});
