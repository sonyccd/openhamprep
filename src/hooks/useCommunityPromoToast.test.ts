import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommunityPromoToast } from './useCommunityPromoToast';
import { toast } from '@/hooks/use-toast';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the ToastAction component
vi.mock('@/components/ui/toast', () => ({
  ToastAction: 'button',
}));

// Mock the PWA install hook
vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(() => ({
    showPrompt: false,
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    triggerInstall: vi.fn(),
    dismissPrompt: vi.fn(),
  })),
}));

describe('useCommunityPromoToast', () => {
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  it('does not show toast when user is not authenticated', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: false,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not show toast when userCreatedAt is null', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: null,
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not show toast when user has forum_username', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: 'existingUser',
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not show toast when less than 3 days since signup', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(2),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not show toast when already shown (localStorage)', () => {
    localStorage.setItem('community-toast-shown', 'true');

    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows toast when all conditions are met', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);

    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Connect with fellow ham radio'),
      })
    );
  });

  it('does not set localStorage when toast is shown (only when dismissed)', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);

    // localStorage should NOT be set just by showing the toast
    // It should only be set when user dismisses it (clicks X or action button)
    expect(localStorage.getItem('community-toast-shown')).toBeNull();
  });

  it('sets localStorage when toast is dismissed via onOpenChange', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);

    // Simulate the toast being dismissed by calling onOpenChange
    const toastCall = mockToast.mock.calls[0][0];
    expect(toastCall.onOpenChange).toBeDefined();
    toastCall.onOpenChange(false);

    expect(localStorage.getItem('community-toast-shown')).toBe('true');
  });

  it('only shows toast once even with re-renders', () => {
    const { rerender } = renderHook(
      ({ userCreatedAt, forumUsername, isAuthenticated }) =>
        useCommunityPromoToast({ userCreatedAt, forumUsername, isAuthenticated }),
      {
        initialProps: {
          userCreatedAt: getDateDaysAgo(5),
          forumUsername: null as string | null,
          isAuthenticated: true,
        },
      }
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender({
      userCreatedAt: getDateDaysAgo(5),
      forumUsername: null,
      isAuthenticated: true,
    });

    vi.advanceTimersByTime(2000);
    // Should still only be called once due to localStorage
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('shows toast exactly at 3 days boundary', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(3),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('shows toast immediately in test mode (bypasses 3-day check)', () => {
    // Enable test mode
    localStorage.setItem('community-toast-test-mode', 'true');

    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(0), // Brand new account
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('does not show toast when PWA install banner is visible', async () => {
    // Mock PWA banner as showing
    const { usePWAInstall } = await import('@/hooks/usePWAInstall');
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: true,
      canInstall: true,
      isInstalled: false,
      isIOS: false,
      triggerInstall: vi.fn(),
      dismissPrompt: vi.fn(),
    });

    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });
});
