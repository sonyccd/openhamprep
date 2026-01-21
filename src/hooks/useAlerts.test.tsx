import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAlerts,
  useAlertCounts,
  useUnacknowledgedAlertCount,
  useAcknowledgeAlert,
  useResolveAlert,
  useAlertRules,
  useToggleAlertRule,
  useMonitorRuns,
} from './useAlerts';

// Mock Supabase client
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Sample test data
const mockAlerts = [
  {
    id: 'alert-1',
    rule_id: 'rule-1',
    title: 'High Error Rate',
    message: 'Error rate exceeded threshold',
    severity: 'critical',
    context: { error_count: 10 },
    status: 'pending',
    acknowledged_at: null,
    acknowledged_by: null,
    acknowledgment_note: null,
    resolved_at: null,
    auto_resolved: false,
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
    rule: { id: 'rule-1', name: 'High Error Rate Rule' },
  },
  {
    id: 'alert-2',
    rule_id: 'rule-2',
    title: 'Timeout Pattern',
    message: 'Multiple timeouts detected',
    severity: 'warning',
    context: { matched_pattern: 'timeout' },
    status: 'acknowledged',
    acknowledged_at: '2026-01-20T11:00:00Z',
    acknowledged_by: 'user-1',
    acknowledgment_note: 'Investigating',
    resolved_at: null,
    auto_resolved: false,
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-01-20T11:00:00Z',
    rule: { id: 'rule-2', name: 'Timeout Detection' },
  },
];

const mockAlertRules = [
  {
    id: 'rule-1',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds threshold',
    rule_type: 'error_rate',
    target_functions: null,
    config: { threshold: 5, window_minutes: 15 },
    severity: 'critical',
    cooldown_minutes: 30,
    is_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Timeout Detection',
    description: 'Alert on timeout patterns',
    rule_type: 'error_pattern',
    target_functions: null,
    config: { pattern: 'timeout|timed out' },
    severity: 'warning',
    cooldown_minutes: 60,
    is_enabled: false,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

const mockMonitorRuns = [
  {
    id: 'run-1',
    started_at: '2026-01-20T12:00:00Z',
    completed_at: '2026-01-20T12:00:05Z',
    rules_evaluated: 5,
    alerts_created: 1,
    alerts_auto_resolved: 0,
    logs_analyzed: 100,
    duration_ms: 5000,
    status: 'completed',
    error_message: null,
    created_at: '2026-01-20T12:00:00Z',
  },
];

describe('useAlerts hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('useAlerts', () => {
    it('should fetch all alerts when no filter provided', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
        }),
      });

      const { result } = renderHook(() => useAlerts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('alerts');
    });

    it('should filter by active status (pending + acknowledged)', async () => {
      const selectMock = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
        }),
      });
      mockFrom.mockReturnValue({ select: selectMock });

      const { result } = renderHook(() => useAlerts('active'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should filter by specific status', async () => {
      const eqMock = vi.fn().mockResolvedValue({
        data: [mockAlerts[0]],
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: eqMock,
          }),
        }),
      });

      const { result } = renderHook(() => useAlerts('pending'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle errors', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const { result } = renderHook(() => useAlerts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAlertCounts', () => {
    it('should fetch counts for all statuses', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      });

      // Override for pending and acknowledged (no gte filter)
      mockFrom.mockImplementation((table: string) => {
        if (table === 'alerts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((field: string, value: string) => {
                if (value === 'resolved') {
                  return {
                    gte: vi.fn().mockResolvedValue({ count: 3, error: null }),
                  };
                }
                return Promise.resolve({
                  count: value === 'pending' ? 2 : 1,
                  error: null,
                });
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const { result } = renderHook(() => useAlertCounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        pending: 2,
        acknowledged: 1,
        resolved: 3,
      });
    });
  });

  describe('useUnacknowledgedAlertCount', () => {
    it('should return count of pending alerts', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      });

      const { result } = renderHook(() => useUnacknowledgedAlertCount(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(5);
    });

    it('should return 0 when count is null', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      });

      const { result } = renderHook(() => useUnacknowledgedAlertCount(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(0);
    });
  });

  describe('useAcknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: updateMock });

      const { result } = renderHook(() => useAcknowledgeAlert(), { wrapper });

      await result.current.mutateAsync({ alertId: 'alert-1', note: 'Looking into it' });

      expect(mockFrom).toHaveBeenCalledWith('alerts');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'acknowledged',
          acknowledged_by: 'user-123',
          acknowledgment_note: 'Looking into it',
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useAcknowledgeAlert(), { wrapper });

      await expect(
        result.current.mutateAsync({ alertId: 'alert-1' })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('useResolveAlert', () => {
    it('should resolve an alert', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: updateMock });

      const { result } = renderHook(() => useResolveAlert(), { wrapper });

      await result.current.mutateAsync('alert-1');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          auto_resolved: false,
        })
      );
    });
  });

  describe('useAlertRules', () => {
    it('should fetch all alert rules', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockAlertRules, error: null }),
        }),
      });

      const { result } = renderHook(() => useAlertRules(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('alert_rules');
    });
  });

  describe('useToggleAlertRule', () => {
    it('should toggle rule enabled status', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: updateMock });

      const { result } = renderHook(() => useToggleAlertRule(), { wrapper });

      await result.current.mutateAsync({ ruleId: 'rule-1', isEnabled: false });

      expect(updateMock).toHaveBeenCalledWith({ is_enabled: false });
    });
  });

  describe('useMonitorRuns', () => {
    it('should fetch recent monitor runs', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: mockMonitorRuns, error: null }),
          }),
        }),
      });

      const { result } = renderHook(() => useMonitorRuns(10), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith('system_monitor_runs');
    });
  });

});
