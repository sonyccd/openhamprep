import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useBadges } from './useBadges';

// Mock dependencies
const mockUser = { id: 'test-user-id', email: 'test@example.com' };

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  })),
}));

// Mock Supabase - define the mock function inline to avoid hoisting issues
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', async () => {
  return {
    supabase: {
      rpc: (...args: unknown[]) => mockRpc(...args),
    },
  };
});

// Raw data from Supabase
const mockRawBadges = [
  {
    badge_id: '1',
    slug: 'first-question',
    name: 'First Steps',
    description: 'Answer your first question',
    category: 'activity',
    icon_name: 'play',
    tier: 'bronze',
    points: 5,
    display_order: 1,
    unlocked_at: '2024-01-10T10:00:00Z',
    is_seen: true,
    is_unlocked: true,
  },
  {
    badge_id: '2',
    slug: 'streak-3',
    name: 'Getting Started',
    description: 'Achieve a 3-day study streak',
    category: 'activity',
    icon_name: 'flame',
    tier: 'bronze',
    points: 15,
    display_order: 3,
    unlocked_at: '2024-01-12T10:00:00Z',
    is_seen: false,
    is_unlocked: true,
  },
  {
    badge_id: '3',
    slug: 'streak-7',
    name: 'Week Warrior',
    description: 'Achieve a 7-day study streak',
    category: 'activity',
    icon_name: 'flame',
    tier: 'silver',
    points: 25,
    display_order: 4,
    unlocked_at: null,
    is_seen: false,
    is_unlocked: false,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching badges', () => {
    it('fetches and transforms badge data', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allBadges).toHaveLength(3);
      expect(result.current.allBadges[0].name).toBe('First Steps');
      expect(result.current.allBadges[0].iconName).toBe('play');
    });

    it('separates unlocked and locked badges', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.unlockedBadges).toHaveLength(2);
      expect(result.current.lockedBadges).toHaveLength(1);
    });

    it('calculates total points from unlocked badges', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First Steps (5) + Getting Started (15) = 20
      expect(result.current.totalPoints).toBe(20);
    });

    it('identifies unseen badges', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.unseenBadges).toHaveLength(1);
      expect(result.current.unseenCount).toBe(1);
      expect(result.current.unseenBadges[0].slug).toBe('streak-3');
    });
  });

  describe('getBadgesByCategory', () => {
    it('filters badges by category', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activityBadges = result.current.getBadgesByCategory('activity');
      expect(activityBadges).toHaveLength(3);
    });
  });

  describe('getRecentBadges', () => {
    it('returns most recently unlocked badges', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const recentBadges = result.current.getRecentBadges(5);
      expect(recentBadges).toHaveLength(2); // Only 2 unlocked
      // Most recent first (streak-3 unlocked on 12th, first-question on 10th)
      expect(recentBadges[0].slug).toBe('streak-3');
    });

    it('respects limit parameter', async () => {
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const recentBadges = result.current.getRecentBadges(1);
      expect(recentBadges).toHaveLength(1);
    });
  });

  describe('checkBadges', () => {
    it('calls RPC and returns newly awarded badges', async () => {
      // First call for initial fetch
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set up mock for checkBadges
      const newBadge = {
        badge_id: '4',
        badge_slug: 'tests-5',
        badge_name: 'Regular Tester',
        badge_tier: 'bronze',
        badge_points: 20,
        badge_icon: 'award',
      };
      mockRpc.mockResolvedValueOnce({
        data: [newBadge],
        error: null,
      });

      let newBadges;
      await act(async () => {
        newBadges = await result.current.checkBadges();
      });

      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].name).toBe('Regular Tester');
      expect(newBadges[0].points).toBe(20);
    });

    it('returns empty array on error', async () => {
      // First call for initial fetch
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set up mock for checkBadges to fail
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Test error'),
      });

      let newBadges;
      await act(async () => {
        newBadges = await result.current.checkBadges();
      });

      expect(newBadges).toHaveLength(0);
    });
  });

  describe('markBadgesSeen', () => {
    it('calls RPC and updates local cache', async () => {
      // First call for initial fetch
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set up mock for markBadgesSeen
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await act(async () => {
        await result.current.markBadgesSeen(['2']); // streak-3 badge
      });

      // The local cache should be updated optimistically
      // Note: We need to check that the RPC was called
      expect(mockRpc).toHaveBeenLastCalledWith('mark_badges_seen', {
        p_user_id: mockUser.id,
        p_badge_ids: ['2'],
      });
    });

    it('does nothing with empty array', async () => {
      // First call for initial fetch
      mockRpc.mockResolvedValueOnce({
        data: mockRawBadges,
        error: null,
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountBefore = mockRpc.mock.calls.length;

      await act(async () => {
        await result.current.markBadgesSeen([]);
      });

      // Should not make another RPC call
      expect(mockRpc.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe('error handling', () => {
    it('handles fetch error gracefully', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Network error'),
      });

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.allBadges).toHaveLength(0);
    });
  });

  describe('default values', () => {
    it('returns sensible defaults while loading', () => {
      mockRpc.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useBadges(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.allBadges).toHaveLength(0);
      expect(result.current.unlockedBadges).toHaveLength(0);
      expect(result.current.totalPoints).toBe(0);
      expect(result.current.unseenCount).toBe(0);
    });
  });
});
