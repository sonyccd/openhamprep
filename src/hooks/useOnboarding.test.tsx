import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from './useOnboarding';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up window.resetOnboarding
    delete window.resetOnboarding;
  });

  describe('Initial State', () => {
    it('should show onboarding when database returns onboarding_completed as false', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.showOnboarding).toBe(true);
    });

    it('should not show onboarding when database returns onboarding_completed as true', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: true },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });

    it('should not show onboarding on database error', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Default to not showing onboarding on error
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('should update state and call database when completing onboarding', async () => {
      const mockUpdateSelect = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: false },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
        expect(result.current.showOnboarding).toBe(false);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
    });
  });

  describe('skipOnboarding', () => {
    it('should update state and call database when skipping onboarding', async () => {
      const mockUpdateSelect = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: false },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.skipOnboarding();
      });

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
        expect(result.current.showOnboarding).toBe(false);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
    });
  });

  describe('resetOnboarding', () => {
    it('should reset state and call database', async () => {
      const mockUpdateSelect = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: true },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);

      act(() => {
        result.current.resetOnboarding();
      });

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
        expect(result.current.showOnboarding).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: false });
    });
  });

  describe('setShowOnboarding', () => {
    it('should allow manually setting showOnboarding state', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.showOnboarding).toBe(true);

      act(() => {
        result.current.setShowOnboarding(false);
      });

      expect(result.current.showOnboarding).toBe(false);

      act(() => {
        result.current.setShowOnboarding(true);
      });

      expect(result.current.showOnboarding).toBe(true);
    });
  });

  describe('Global resetOnboarding function', () => {
    it('should register window.resetOnboarding on mount', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      expect(window.resetOnboarding).toBeDefined();
      expect(typeof window.resetOnboarding).toBe('function');
    });

    it('should remove window.resetOnboarding on unmount', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      const { unmount } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      expect(window.resetOnboarding).toBeDefined();

      unmount();

      expect(window.resetOnboarding).toBeUndefined();
    });
  });

  describe('isLoading state', () => {
    it('should return isLoading as true initially', () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after fetching', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch exception gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should default to not showing onboarding on exception
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.showOnboarding).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle update error gracefully and still update state optimistically', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockUpdateSelect = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: false },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
      });

      // State should update optimistically even before DB call completes
      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
        expect(result.current.showOnboarding).toBe(false);
      });

      // Verify the update was attempted
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle update exception gracefully and still update state optimistically', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockUpdateSelect = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: false },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
      });

      // State should update optimistically even before DB call completes
      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
        expect(result.current.showOnboarding).toBe(false);
      });

      // Verify the update was attempted
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ onboarding_completed: true });
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('window.resetOnboarding function', () => {
    it('should log error when no user is logged in', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Override useAuth mock temporarily to return no user
      const originalMock = vi.mocked(await import('./useAuth'));
      vi.doMock('./useAuth', () => ({
        useAuth: () => ({ user: null }),
      }));

      // Re-import to get the new mock
      vi.resetModules();
      const { useOnboarding: useOnboardingNoUser } = await import('./useOnboarding');

      // Create wrapper with no user
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null,
            }),
          }),
        }),
      });

      renderHook(() => useOnboardingNoUser(), { wrapper });

      // Call the global function
      if (window.resetOnboarding) {
        await window.resetOnboarding();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('No user logged in. Please log in first.');

      consoleLogSpy.mockRestore();

      // Restore original mock
      vi.doMock('./useAuth', () => ({
        useAuth: () => ({ user: { id: 'test-user-id' } }),
      }));
      vi.resetModules();
    });

    it('should handle window.resetOnboarding database error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: true },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call the global function
      await window.resetOnboarding();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error resetting onboarding:', { message: 'Database error' });

      consoleErrorSpy.mockRestore();
    });

    it('should handle window.resetOnboarding exception', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: true },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call the global function
      await window.resetOnboarding();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should reload page on successful reset', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { onboarding_completed: true },
            error: null,
          }),
        }),
      });

      mockSupabaseFrom.mockImplementation(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call the global function
      await window.resetOnboarding();

      expect(consoleLogSpy).toHaveBeenCalledWith('Onboarding reset! Refreshing page...');
      expect(reloadMock).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });
});
