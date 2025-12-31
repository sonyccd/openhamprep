import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeocodeExamSessions } from './useExamSessions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe('useGeocodeExamSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a mutation object', () => {
    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('calls geocode-addresses edge function', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      data: { processed: 5, remaining: 0 },
      error: null,
    });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('geocode-addresses');
    });
  });

  it('shows success toast on successful geocoding', async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { processed: 5, remaining: 0 },
      error: null,
    });

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Geocoded 5 sessions');
    });
  });

  it('calls onProgress callback with progress updates', async () => {
    const mockInvoke = vi.fn()
      .mockResolvedValueOnce({ data: { processed: 3, remaining: 2 }, error: null })
      .mockResolvedValueOnce({ data: { processed: 2, remaining: 0 }, error: null });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const onProgress = vi.fn();
    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5, onProgress });

    await waitFor(() => {
      expect(onProgress).toHaveBeenCalled();
    });

    // Check that progress was reported
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 5,
      })
    );
  });

  it('shows error toast on geocoding failure', async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'Geocoding failed' },
    });

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('stops geocoding loop when remaining is 0', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      data: { processed: 5, remaining: 0 },
      error: null,
    });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should only be called once since remaining is 0
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('stops geocoding loop when processed is 0', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      data: { processed: 0, remaining: 5 },
      error: null,
    });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should only be called once to prevent infinite loop
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('continues geocoding loop when there are remaining addresses', async () => {
    const mockInvoke = vi.fn()
      .mockResolvedValueOnce({ data: { processed: 2, remaining: 3 }, error: null })
      .mockResolvedValueOnce({ data: { processed: 3, remaining: 0 }, error: null });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should be called twice
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('sets isPending to true while geocoding', async () => {
    let resolveInvoke: (value: unknown) => void;
    const invokePromise = new Promise((resolve) => {
      resolveInvoke = resolve;
    });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockReturnValue(invokePromise);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Resolve the promise
    resolveInvoke!({ data: { processed: 5, remaining: 0 }, error: null });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('returns total processed count on success', async () => {
    const mockInvoke = vi.fn()
      .mockResolvedValueOnce({ data: { processed: 2, remaining: 3 }, error: null })
      .mockResolvedValueOnce({ data: { processed: 3, remaining: 0 }, error: null });
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockImplementation(mockInvoke);

    const { result } = renderHook(() => useGeocodeExamSessions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ initialCount: 5 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ processed: 5 });
  });
});
