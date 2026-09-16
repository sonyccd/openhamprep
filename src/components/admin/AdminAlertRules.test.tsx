import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AdminAlertRules } from './AdminAlertRules';
import { createTestQueryClient, muiWrapper } from '@/test/utils/testWrappers';

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

const errorRateRule = {
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
};

const patternRule = {
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
};

const healthRule = {
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
};

const allRules = [errorRateRule, patternRule, healthRule];

const mockToggle = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const renderRules = (
  rules: unknown[] = allRules,
  state: { isLoading?: boolean; error?: Error | null } = {}
) => {
  vi.mocked(useAlertRules).mockReturnValue({
    data: rules,
    isLoading: state.isLoading ?? false,
    error: state.error ?? null,
  } as never);

  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<AdminAlertRules />, { wrapper });
};

const dialog = () => within(screen.getByRole('dialog'));

/** MUI renders the Select as a div[role=combobox] opening a listbox. */
const choose = async (
  user: ReturnType<typeof userEvent.setup>,
  selectName: string,
  optionName: RegExp | string
) => {
  await user.click(screen.getByRole('combobox', { name: selectName }));
  await user.click(screen.getByRole('option', { name: optionName }));
};

describe('AdminAlertRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToggleAlertRule).mockReturnValue({
      mutate: mockToggle,
      isPending: false,
    } as never);
    vi.mocked(useCreateAlertRule).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
    } as never);
    vi.mocked(useUpdateAlertRule).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
    } as never);
    vi.mocked(useDeleteAlertRule).mockReturnValue({
      mutate: mockDelete,
      isPending: false,
    } as never);
  });

  describe('the list', () => {
    it('heads the section and counts what is enabled', () => {
      renderRules();

      expect(screen.getByRole('heading', { name: 'Alert Rules' })).toBeInTheDocument();
      expect(screen.getByText('2 of 3 rules enabled')).toBeInTheDocument();
    });

    it('labels each rule with its type and severity', () => {
      renderRules();

      expect(screen.getByText('Error Rate')).toBeInTheDocument();
      expect(screen.getByText('Error Pattern')).toBeInTheDocument();
      expect(screen.getByText('Function Health')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('summarises each rule type by the config it actually uses', () => {
      renderRules();

      expect(screen.getByText('Threshold: 5 errors')).toBeInTheDocument();
      expect(screen.getByText('Window: 15 min')).toBeInTheDocument();
      expect(screen.getByText('timeout|timed out')).toBeInTheDocument();
      expect(screen.getByText('Failures: 3 consecutive')).toBeInTheDocument();
    });

    it('lists the functions a rule is scoped to', () => {
      renderRules();

      expect(screen.getByText('my-function')).toBeInTheDocument();
    });

    it('shows a disabled rule switched off', () => {
      renderRules();

      expect(screen.getByRole('switch', { name: 'Enable Timeout Detection' })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: 'Enable High Error Rate' })).toBeChecked();
    });

    it('toggles a rule', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('switch', { name: 'Enable Timeout Detection' }));

      expect(mockToggle).toHaveBeenCalledWith({ ruleId: 'rule-2', isEnabled: true });
    });
  });

  describe('list states', () => {
    it('names the loading indicator', () => {
      renderRules([], { isLoading: true });

      expect(screen.getByLabelText('Loading alert rules')).toBeInTheDocument();
    });

    it('surfaces a load failure with its reason', () => {
      renderRules([], { error: new Error('network down') });

      expect(screen.getByText(/Failed to load alert rules: network down/)).toBeInTheDocument();
    });

    it('offers a way in when there are no rules yet', async () => {
      const user = userEvent.setup();
      renderRules([]);

      expect(screen.getByText('No alert rules')).toBeInTheDocument();
      await user.click(screen.getAllByRole('button', { name: 'Create Rule' })[1]);

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Create Alert Rule');
    });
  });

  /**
   * The bug this port was written around.
   *
   * Seeding was a useState lazy initialiser, which runs once — at the editor's
   * first mount, while `rule` was still undefined, because AdminAlertRules
   * mounts the editor unconditionally and only toggles `open`. So every edit
   * opened on blank defaults, and saving wrote those defaults over the rule.
   */
  describe('editing loads the rule', () => {
    it('fills the form from the rule being edited', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Edit High Error Rate' }));

      expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit Alert Rule');
      expect(dialog().getByRole('textbox', { name: /Rule Name/ })).toHaveValue('High Error Rate');
      expect(dialog().getByRole('spinbutton', { name: 'Cooldown (minutes)' })).toHaveValue(30);
      expect(dialog().getByRole('spinbutton', { name: 'Error Threshold' })).toHaveValue(5);
    });

    it('re-seeds when a different rule is opened', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Edit High Error Rate' }));
      await user.click(dialog().getByRole('button', { name: 'Cancel' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: 'Edit Timeout Detection' }));

      expect(dialog().getByRole('textbox', { name: /Rule Name/ })).toHaveValue('Timeout Detection');
      expect(dialog().getByRole('textbox', { name: /Pattern to Match/ })).toHaveValue(
        'timeout|timed out'
      );
    });

    it('shows the fields belonging to the edited rule type', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Edit Consecutive Failures' }));

      expect(dialog().getByRole('spinbutton', { name: /Consecutive Failures/ })).toHaveValue(3);
      expect(dialog().queryByRole('spinbutton', { name: 'Error Threshold' })).not.toBeInTheDocument();
    });

    it('opens blank for Create after an edit', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Edit High Error Rate' }));
      await user.click(dialog().getByRole('button', { name: 'Cancel' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));

      expect(dialog().getByRole('textbox', { name: /Rule Name/ })).toHaveValue('');
    });

    it('saves the edit against the rule it opened on', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Edit High Error Rate' }));
      const name = dialog().getByRole('textbox', { name: /Rule Name/ });
      await user.clear(name);
      await user.type(name, 'Renamed Rule');
      await user.click(dialog().getByRole('button', { name: 'Save Changes' }));

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rule-1',
          name: 'Renamed Rule',
          cooldown_minutes: 30,
          config: { threshold: 5, window_minutes: 15 },
        }),
        expect.anything()
      );
    });
  });

  describe('creating', () => {
    const openCreate = async (user: ReturnType<typeof userEvent.setup>) => {
      renderRules();
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));
    };

    it('labels every control, including the two selects', async () => {
      const user = userEvent.setup();
      await openCreate(user);

      expect(dialog().getByRole('textbox', { name: /Rule Name/ })).toBeInTheDocument();
      expect(dialog().getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
      expect(dialog().getByRole('combobox', { name: 'Rule Type' })).toBeInTheDocument();
      expect(dialog().getByRole('combobox', { name: 'Severity' })).toBeInTheDocument();
      expect(dialog().getByRole('spinbutton', { name: 'Cooldown (minutes)' })).toBeInTheDocument();
      expect(
        dialog().getByRole('textbox', { name: /Target Functions/ })
      ).toBeInTheDocument();
    });

    it('swaps the config fields when the rule type changes', async () => {
      const user = userEvent.setup();
      await openCreate(user);

      expect(dialog().getByRole('spinbutton', { name: 'Error Threshold' })).toBeInTheDocument();

      await choose(user, 'Rule Type', /Function Health/);

      expect(dialog().getByRole('spinbutton', { name: /Consecutive Failures/ })).toBeInTheDocument();
      expect(dialog().queryByRole('spinbutton', { name: 'Error Threshold' })).not.toBeInTheDocument();
    });

    it('splits target functions into a list, and sends null for none', async () => {
      const user = userEvent.setup();
      await openCreate(user);

      await user.type(dialog().getByRole('textbox', { name: /Rule Name/ }), 'New Rule');
      await user.type(
        dialog().getByRole('textbox', { name: /Target Functions/ }),
        'one, two , three'
      );
      await user.click(dialog().getByRole('button', { name: 'Create Rule' }));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ target_functions: ['one', 'two', 'three'] }),
        expect.anything()
      );
    });

    it('builds the config from the chosen rule type only', async () => {
      const user = userEvent.setup();
      await openCreate(user);

      await user.type(dialog().getByRole('textbox', { name: /Rule Name/ }), 'Health Rule');
      await choose(user, 'Rule Type', /Function Health/);
      await user.click(dialog().getByRole('button', { name: 'Create Rule' }));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          rule_type: 'function_health',
          config: { consecutive_failures: 3 },
          target_functions: null,
        }),
        expect.anything()
      );
    });
  });

  /**
   * Each message used to be a loose <p> beside its input, with no aria-invalid
   * and nothing tying the two together — so a screen reader reached the field,
   * heard nothing wrong with it, and read the message later as stray text.
   */
  describe('validation messages', () => {
    it('ties a rejected pattern to the field it belongs to', async () => {
      const user = userEvent.setup();
      renderRules();
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));

      await user.type(dialog().getByRole('textbox', { name: /Rule Name/ }), 'Bad Pattern');
      await choose(user, 'Rule Type', /Error Pattern/);
      await user.type(dialog().getByRole('textbox', { name: /Pattern to Match/ }), '(a+)+');
      await user.click(dialog().getByRole('button', { name: 'Create Rule' }));

      const pattern = dialog().getByRole('textbox', { name: /Pattern to Match/ });
      expect(pattern).toHaveAttribute('aria-invalid', 'true');
      expect(pattern).toHaveAccessibleDescription(/could cause performance issues/);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    /**
     * Two layers keep counts in range, and neither is the JS validator:
     * every count field parses with `parseInt(value) || 1`, so typing cannot
     * go below 1, and min={1} makes a stored out-of-range value fail native
     * constraint validation — the form never submits, so validate() is never
     * reached. The JS checks stay as belt-and-braces; this pins the behaviour
     * that actually protects the rule.
     */
    it('refuses to save a stored cooldown below the minimum', async () => {
      const user = userEvent.setup();
      renderRules([{ ...errorRateRule, cooldown_minutes: 0 }]);

      await user.click(screen.getByRole('button', { name: 'Edit High Error Rate' }));
      const cooldown = dialog().getByRole('spinbutton', { name: 'Cooldown (minutes)' });
      expect((cooldown as HTMLInputElement).checkValidity()).toBe(false);

      await user.click(dialog().getByRole('button', { name: 'Save Changes' }));

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    /** The `|| 1` floor means the field snaps back rather than going empty. */
    it('never leaves a count field blank', async () => {
      const user = userEvent.setup();
      renderRules();
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));

      const cooldown = dialog().getByRole('spinbutton', { name: 'Cooldown (minutes)' });
      await user.clear(cooldown);

      expect(cooldown).toHaveValue(1);
    });

    /** An empty optional filter is not what failed; the error is not its. */
    it('does not mark the optional filter when it is empty', async () => {
      const user = userEvent.setup();
      renderRules();
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));

      await user.type(dialog().getByRole('textbox', { name: /Rule Name/ }), 'Rate Rule');
      await user.click(dialog().getByRole('button', { name: 'Create Rule' }));

      expect(dialog().getByRole('textbox', { name: /Error Pattern Filter/ })).toHaveAttribute(
        'aria-invalid',
        'false'
      );
    });

    it('clears a stale error when the dialog is reopened', async () => {
      const user = userEvent.setup();
      renderRules();
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));

      await user.type(dialog().getByRole('textbox', { name: /Rule Name/ }), 'Bad Pattern');
      await choose(user, 'Rule Type', /Error Pattern/);
      await user.type(dialog().getByRole('textbox', { name: /Pattern to Match/ }), '(a+)+');
      await user.click(dialog().getByRole('button', { name: 'Create Rule' }));
      expect(dialog().getByRole('textbox', { name: /Pattern to Match/ })).toHaveAttribute(
        'aria-invalid',
        'true'
      );

      await user.click(dialog().getByRole('button', { name: 'Cancel' }));
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: 'Create Rule' }));
      await choose(user, 'Rule Type', /Error Pattern/);

      // A fresh, empty pattern field must not open already marked invalid.
      expect(dialog().getByRole('textbox', { name: /Pattern to Match/ })).toHaveAttribute(
        'aria-invalid',
        'false'
      );
    });
  });

  describe('deleting', () => {
    /** Radix supplied role="alertdialog" and the description wiring; MUI does not. */
    it('confirms first, naming the rule, as an alertdialog', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Delete High Error Rate' }));

      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toHaveAccessibleName('Delete Alert Rule');
      expect(confirm).toHaveAccessibleDescription(/"High Error Rate"/);
      expect(confirm).toHaveAccessibleDescription(/cannot be undone/);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deletes once confirmed', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Delete High Error Rate' }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' })
      );

      expect(mockDelete).toHaveBeenCalledWith('rule-1', expect.anything());
    });

    it('stays put when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      renderRules();

      await user.click(screen.getByRole('button', { name: 'Delete High Error Rate' }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('alertdialog'));
      expect(mockDelete).not.toHaveBeenCalled();
      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
    });
  });
});
