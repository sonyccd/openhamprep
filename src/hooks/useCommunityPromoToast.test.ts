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

  it('does not show toast when profile is still loading (forumUsername undefined)', () => {
    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: undefined, // Profile hasn't loaded yet
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('shows toast only after profile loads with null forum_username', () => {
    const { rerender } = renderHook(
      ({ forumUsername }) =>
        useCommunityPromoToast({
          userCreatedAt: getDateDaysAgo(5),
          forumUsername,
          isAuthenticated: true,
        }),
      {
        initialProps: { forumUsername: undefined as string | null | undefined },
      }
    );

    // Profile still loading - should not show toast
    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();

    // Profile loads with null forum_username - should show toast
    rerender({ forumUsername: null });
    vi.advanceTimersByTime(2000);
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('does not show toast when profile loads with existing forum_username', () => {
    const { rerender } = renderHook(
      ({ forumUsername }) =>
        useCommunityPromoToast({
          userCreatedAt: getDateDaysAgo(5),
          forumUsername,
          isAuthenticated: true,
        }),
      {
        initialProps: { forumUsername: undefined as string | null | undefined },
      }
    );

    // Profile still loading - should not show toast
    vi.advanceTimersByTime(2000);
    expect(mockToast).not.toHaveBeenCalled();

    // Profile loads with existing forum_username - should NOT show toast
    rerender({ forumUsername: 'existingUser' });
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

  it('clears timeout on unmount before toast is shown', () => {
    const { unmount } = renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    // Unmount before the toast timeout fires
    unmount();
    vi.advanceTimersByTime(2000);

    // Toast should not be called after unmount
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('handles popup blocker gracefully when action button is clicked', async () => {
    // Reset PWA mock to default (not showing) - previous test may have changed it
    const { usePWAInstall } = await import('@/hooks/usePWAInstall');
    vi.mocked(usePWAInstall).mockReturnValue({
      showPrompt: false,
      canInstall: false,
      isInstalled: false,
      isIOS: false,
      triggerInstall: vi.fn(),
      dismissPrompt: vi.fn(),
    });

    // Mock window.open to return null (simulating popup blocker)
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    renderHook(() =>
      useCommunityPromoToast({
        userCreatedAt: getDateDaysAgo(5),
        forumUsername: null,
        isAuthenticated: true,
      })
    );

    vi.advanceTimersByTime(2000);

    // Get the action element and simulate click
    const toastCall = mockToast.mock.calls[0][0];
    expect(toastCall.action).toBeDefined();

    // The action is a createElement result, so we need to get the onClick from props
    const actionProps = toastCall.action.props;
    actionProps.onClick();

    // Should log a warning about popup blocker
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Popup blocked. Please allow popups to visit the community forum.'
    );

    // Cleanup
    consoleWarnSpy.mockRestore();
    windowOpenSpy.mockRestore();
  });
});
