import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationWarningDialog } from './NavigationWarningDialog';
import { muiWrapper } from '@/test/utils/testWrappers';

const setup = (overrides: Partial<Parameters<typeof NavigationWarningDialog>[0]> = {}) => {
  const props = { open: true, onCancel: vi.fn(), onConfirm: vi.fn(), ...overrides };
  render(<NavigationWarningDialog {...props} />, { wrapper: muiWrapper });
  return props;
};

describe('NavigationWarningDialog', () => {
  it('renders nothing while closed', () => {
    setup({ open: false });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  /**
   * The whole reason this component exists. Radix's AlertDialog set
   * role="alertdialog" itself and registered its Description automatically;
   * MUI's Dialog does neither, so both are carried by hand — and a dropped
   * describedby is invisible until someone uses a screen reader (#283).
   */
  it('is an alertdialog, not a plain dialog', () => {
    setup();

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('names itself from the title and describes itself from the body', () => {
    setup();
    const dialog = screen.getByRole('alertdialog');

    expect(dialog).toHaveAccessibleName('Test in Progress');
    expect(dialog).toHaveAccessibleDescription(/progress will not be saved/i);
  });

  it('calls onCancel from "Return to Test"', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = setup();

    await user.click(screen.getByRole('button', { name: /return to test/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm from "End Test"', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = setup();

    await user.click(screen.getByRole('button', { name: /end test/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  /**
   * Dismissing means "don't leave the test", so Escape routes to cancel
   * rather than to a bare close. The old Radix version passed
   * setShowNavigationWarning here, which left pendingView set on this path.
   */
  it('treats Escape as cancelling, not as a bare close', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = setup();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
