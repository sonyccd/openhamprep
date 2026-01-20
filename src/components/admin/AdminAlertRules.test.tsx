import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAlertRules } from './AdminAlertRules';

// Mock the useAlerts hooks
vi.mock('@/hooks/useAlerts', () => ({
  useAlertRules: vi.fn(),
  useToggleAlertRule: vi.fn(),
  useCreateAlertRule: vi.fn(),
  useUpdateAlertRule: vi.fn(),
  useDeleteAlertRule: vi.fn(),
}));

import {
  useAlertRules,
  useToggleAlertRule,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
} from '@/hooks/useAlerts';

// Sample test data
const mockAlertRules = [
  {
    id: 'rule-1',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds threshold',
    rule_type: 'error_rate' as const,
    target_functions: null,
    config: { threshold: 5, window_minutes: 15 },
    severity: 'critical' as const,
    cooldown_minutes: 30,
    is_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Timeout Detection',
    description: 'Alert on timeout patterns',
    rule_type: 'error_pattern' as const,
    target_functions: ['my-function'],
    config: { pattern: 'timeout|timed out', case_sensitive: false },
    severity: 'warning' as const,
    cooldown_minutes: 60,
    is_enabled: false,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'rule-3',
    name: 'Consecutive Failures',
    description: 'Alert on consecutive function failures',
    rule_type: 'function_health' as const,
    target_functions: null,
    config: { consecutive_failures: 3 },
    severity: 'info' as const,
    cooldown_minutes: 120,
    is_enabled: true,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
];

describe('AdminAlertRules', () => {
  let queryClient: QueryClient;

  const mockToggleMutate = vi.fn();
  const mockCreateMutate = vi.fn();
  const mockUpdateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();

  const renderComponent = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminAlertRules />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(useAlertRules).mockReturnValue({
      data: mockAlertRules,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAlertRules>);

    vi.mocked(useToggleAlertRule).mockReturnValue({
      mutate: mockToggleMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleAlertRule>);

    vi.mocked(useCreateAlertRule).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAlertRule>);

    vi.mocked(useUpdateAlertRule).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAlertRule>);

    vi.mocked(useDeleteAlertRule).mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAlertRule>);
  });

  describe('Rendering', () => {
    it('should render the Alert Rules heading', () => {
      renderComponent();

      expect(screen.getByText('Alert Rules')).toBeInTheDocument();
    });

    it('should show enabled count', () => {
      renderComponent();

      expect(screen.getByText('2 of 3 rules enabled')).toBeInTheDocument();
    });

    it('should render Create Rule button', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /create rule/i })).toBeInTheDocument();
    });

    it('should render all rule cards', () => {
      renderComponent();

      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Timeout Detection')).toBeInTheDocument();
      expect(screen.getByText('Consecutive Failures')).toBeInTheDocument();
    });

    it('should show rule type badges', () => {
      renderComponent();

      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Error Pattern')).toBeInTheDocument();
      expect(screen.getByText('Function Health')).toBeInTheDocument();
    });

    it('should show severity badges', () => {
      renderComponent();

      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('warning')).toBeInTheDocument();
      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should show rule descriptions', () => {
      renderComponent();

      expect(screen.getByText('Alert when error rate exceeds threshold')).toBeInTheDocument();
      expect(screen.getByText('Alert on timeout patterns')).toBeInTheDocument();
    });

    it('should show config details for error_rate rules', () => {
      renderComponent();

      expect(screen.getByText('Threshold: 5 errors')).toBeInTheDocument();
      expect(screen.getByText('Window: 15 min')).toBeInTheDocument();
    });

    it('should show config details for error_pattern rules', () => {
      renderComponent();

      expect(screen.getByText('timeout|timed out')).toBeInTheDocument();
    });

    it('should show config details for function_health rules', () => {
      renderComponent();

      expect(screen.getByText('Failures: 3 consecutive')).toBeInTheDocument();
    });

    it('should show target functions when specified', () => {
      renderComponent();

      expect(screen.getByText('my-function')).toBeInTheDocument();
    });

    it('should show cooldown for each rule', () => {
      renderComponent();

      expect(screen.getByText('Cooldown: 30 min')).toBeInTheDocument();
      expect(screen.getByText('Cooldown: 60 min')).toBeInTheDocument();
      expect(screen.getByText('Cooldown: 120 min')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      vi.mocked(useAlertRules).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as ReturnType<typeof useAlertRules>);

      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useAlertRules).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
      } as ReturnType<typeof useAlertRules>);

      renderComponent();

      expect(screen.getByText(/failed to load alert rules/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no rules', () => {
      vi.mocked(useAlertRules).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAlertRules>);

      renderComponent();

      expect(screen.getByText('No alert rules')).toBeInTheDocument();
      expect(screen.getByText(/create your first rule/i)).toBeInTheDocument();
    });

    it('should show Create Rule button in empty state', () => {
      vi.mocked(useAlertRules).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useAlertRules>);

      renderComponent();

      // Should have 2 create buttons - one in header, one in empty state
      const createButtons = screen.getAllByRole('button', { name: /create rule/i });
      expect(createButtons.length).toBe(2);
    });
  });

  describe('Toggle Rule', () => {
    it('should call toggle mutation when switch clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Find the switches (there are 3 rules)
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBe(3);

      // Click the first switch (for enabled rule)
      await user.click(switches[0]);

      expect(mockToggleMutate).toHaveBeenCalledWith({
        ruleId: 'rule-1',
        isEnabled: false, // Toggling from true to false
      });
    });
  });

  describe('Create Rule', () => {
    it('should open dialog when Create Rule clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: /create rule/i }));

      expect(screen.getByText('Create Alert Rule')).toBeInTheDocument();
    });

    it('should show form fields in create dialog', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: /create rule/i }));

      expect(screen.getByLabelText(/rule name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/rule type/i)).toBeInTheDocument();
      expect(screen.getByText(/severity/i)).toBeInTheDocument();
    });

    it('should close dialog when Cancel clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole('button', { name: /create rule/i }));
      expect(screen.getByText('Create Alert Rule')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Create Alert Rule')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Rule', () => {
    it('should render edit buttons for each rule', () => {
      const { container } = renderComponent();

      // Each rule card should have an edit button with pencil icon
      const pencilIcons = container.querySelectorAll('[class*="lucide-pencil"]');
      expect(pencilIcons.length).toBe(3); // 3 rules
    });
  });

  describe('Delete Rule', () => {
    it('should render delete buttons for each rule', () => {
      const { container } = renderComponent();

      // Each rule card should have a delete button with trash icon
      const trashIcons = container.querySelectorAll('[class*="lucide-trash"]');
      expect(trashIcons.length).toBe(3); // 3 rules
    });
  });

  describe('Disabled Rule Styling', () => {
    it('should apply disabled styling to disabled rules', () => {
      renderComponent();

      // Find the Timeout Detection card (which is disabled)
      const timeoutRule = screen.getByText('Timeout Detection').closest('div[class*="rounded-lg"]');
      expect(timeoutRule).toHaveClass('opacity-75');
    });
  });
});
