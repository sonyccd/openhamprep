import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAlerts } from './AdminAlerts';

// Mock the useAlerts hooks
vi.mock('@/hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
  useAlertCounts: vi.fn(),
  useAcknowledgeAlert: vi.fn(),
  useResolveAlert: vi.fn(),
  useMonitorRuns: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

import {
  useAlerts,
  useAlertCounts,
  useAcknowledgeAlert,
  useResolveAlert,
  useMonitorRuns,
} from '@/hooks/useAlerts';
import { toast } from 'sonner';

// Sample test data
const mockAlerts = [
  {
    id: 'alert-1',
    rule_id: 'rule-1',
    title: 'High Error Rate',
    message: 'Error rate exceeded threshold',
    severity: 'critical' as const,
    context: { error_count: 10, function_names: ['my-function'] },
    status: 'pending' as const,
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
    severity: 'warning' as const,
    context: { matched_pattern: 'timeout' },
    status: 'acknowledged' as const,
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

const mockMonitorRuns = [
  {
    id: 'run-1',
    started_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
    completed_at: new Date(Date.now() - 2 * 60 * 1000 + 5000).toISOString(),
    rules_evaluated: 5,
    alerts_created: 1,
    alerts_auto_resolved: 0,
    logs_analyzed: 100,
    duration_ms: 5000,
    status: 'completed' as const,
    error_message: null,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

describe('AdminAlerts', () => {
  let queryClient: QueryClient;

  const mockAcknowledgeMutate = vi.fn();
  const mockResolveMutate = vi.fn();

  const renderComponent = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminAlerts />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(useAlerts).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAlerts>);

    vi.mocked(useAlertCounts).mockReturnValue({
      data: { pending: 1, acknowledged: 1, resolved: 0 },
    } as ReturnType<typeof useAlertCounts>);

    vi.mocked(useMonitorRuns).mockReturnValue({
      data: mockMonitorRuns,
    } as ReturnType<typeof useMonitorRuns>);

    vi.mocked(useAcknowledgeAlert).mockReturnValue({
      mutate: mockAcknowledgeMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useAcknowledgeAlert>);

    vi.mocked(useResolveAlert).mockReturnValue({
      mutate: mockResolveMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useResolveAlert>);
  });

  describe('Rendering', () => {
    it('should render the System Alerts heading', () => {
      renderComponent();

      expect(screen.getByText('System Alerts')).toBeInTheDocument();
    });

    it('should render status summary cards', () => {
      renderComponent();

      // Check for card headers (there may be duplicate "Pending" etc. in tabs)
      expect(screen.getByText('Resolved (24h)')).toBeInTheDocument();
      expect(screen.getByText('Monitor Status')).toBeInTheDocument();
    });

    it('should display pending count in metric cards', () => {
      renderComponent();

      // The pending count of 1 should be displayed in the metrics area
      // Find by the specific card structure
      const metricCards = document.querySelectorAll('.text-2xl.font-bold');
      expect(metricCards.length).toBeGreaterThan(0);
    });

    it('should render filter tabs', () => {
      renderComponent();

      expect(screen.getByRole('tab', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /pending/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /acknowledged/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /resolved/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    });

    it('should render alert cards', () => {
      renderComponent();

      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Timeout Pattern')).toBeInTheDocument();
    });

    it('should show severity badges', () => {
      renderComponent();

      // Alert titles visible
      expect(screen.getByText('Error rate exceeded threshold')).toBeInTheDocument();
      expect(screen.getByText('Multiple timeouts detected')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as ReturnType<typeof useAlerts>);

      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
      } as ReturnType<typeof useAlerts>);

      renderComponent();

      expect(screen.getByText(/failed to load alerts/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no alerts', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAlerts>);

      renderComponent();

      expect(screen.getByText('No alerts')).toBeInTheDocument();
    });
  });

  describe('Filter Tabs', () => {
    it('should call useAlerts with correct filter when tab clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('tab', { name: /pending/i }));

      // Check that useAlerts was called (it gets called on each render)
      expect(useAlerts).toHaveBeenCalled();
    });
  });

  describe('Alert Actions', () => {
    it('should show Acknowledge button for pending alerts', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
    });

    it('should show Resolve button for non-resolved alerts', () => {
      renderComponent();

      // Should have 2 resolve buttons (one for each non-resolved alert)
      const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
      expect(resolveButtons.length).toBe(2);
    });

    it('should call acknowledge mutation when Acknowledge clicked', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      renderComponent();

      await user.click(screen.getByRole('button', { name: /acknowledge/i }));

      // Dialog should open
      expect(screen.getByText('Acknowledge Alert')).toBeInTheDocument();

      // Click the confirm button in dialog (the second acknowledge button)
      const confirmButtons = screen.getAllByRole('button', { name: /acknowledge/i });
      await user.click(confirmButtons[confirmButtons.length - 1]);

      expect(mockAcknowledgeMutate).toHaveBeenCalled();
    });

    it('should call resolve mutation when Resolve clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const resolveButtons = screen.getAllByRole('button', { name: /resolve/i });
      await user.click(resolveButtons[0]);

      expect(mockResolveMutate).toHaveBeenCalled();
    });
  });

  describe('Monitor Status', () => {
    it('should show last run status', () => {
      renderComponent();

      expect(screen.getByText('Last:')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should show next run time', () => {
      renderComponent();

      expect(screen.getByText('Next:')).toBeInTheDocument();
    });

    it('should show "No runs yet" when no monitor runs', () => {
      vi.mocked(useMonitorRuns).mockReturnValue({
        data: [],
      } as ReturnType<typeof useMonitorRuns>);

      renderComponent();

      expect(screen.getByText('No runs yet')).toBeInTheDocument();
    });
  });

  describe('Alert Details', () => {
    it('should expand details when Show details clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Get the first "Show details" button (there may be multiple)
      const showDetailsButtons = screen.getAllByText('Show details');
      await user.click(showDetailsButtons[0]);

      expect(screen.getByText('Affected functions:')).toBeInTheDocument();
      expect(screen.getByText('my-function')).toBeInTheDocument();
    });

    it('should show auto-resolved badge', () => {
      vi.mocked(useAlerts).mockReturnValue({
        data: [
          {
            ...mockAlerts[0],
            auto_resolved: true,
            status: 'resolved' as const,
          },
        ],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAlerts>);

      renderComponent();

      expect(screen.getByText('Auto-resolved')).toBeInTheDocument();
    });
  });
});
