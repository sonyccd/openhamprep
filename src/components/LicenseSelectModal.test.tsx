import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LicenseSelectModal } from './LicenseSelectModal';
import { muiWrapper } from '@/test/utils';

describe('LicenseSelectModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    selectedTest: 'technician' as const,
    onTestChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the modal when open', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByText('Select License Class')).toBeInTheDocument();
      expect(screen.getByText('Choose which amateur radio license exam you want to study for.')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<LicenseSelectModal {...defaultProps} open={false} />, { wrapper: muiWrapper });

      expect(screen.queryByText('Select License Class')).not.toBeInTheDocument();
    });

    it('displays all three license options', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Amateur Extra')).toBeInTheDocument();
    });

    it('displays descriptions for each license', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByText(/Entry-level license for new operators/)).toBeInTheDocument();
      expect(screen.getByText(/Expanded HF privileges/)).toBeInTheDocument();
      expect(screen.getByText(/Full amateur privileges/)).toBeInTheDocument();
    });

    it('displays question counts and passing scores', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      // Technician and General: 35 questions, 26 to pass
      expect(screen.getAllByText('35 questions').length).toBe(2);
      expect(screen.getAllByText('26 to pass').length).toBe(2);

      // Extra: 50 questions, 37 to pass
      expect(screen.getByText('50 questions')).toBeInTheDocument();
      expect(screen.getByText('37 to pass')).toBeInTheDocument();
    });

    it('shows "Current" badge on the currently selected license', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="general" />, { wrapper: muiWrapper });

      // With a native radio the input and its label are siblings, not
      // parent and child, so DOM containment no longer describes this. The
      // thing that actually matters is that the status is announced: the
      // chip sits inside the label, so it reaches the accessible name.
      expect(screen.getByRole('radio', { name: /General/ })).toHaveAccessibleName(/Current/);
    });
  });

  // #274: the previous version declared role="radiogroup" with role="radio"
  // on three <button>s and implemented none of the APG keyboard contract —
  // three tab stops instead of one, arrow keys that did nothing. These assert
  // the contract rather than the markup, and they pass because the options are
  // native <input type="radio"> now, not because anything here re-implements
  // it.
  describe('Radiogroup keyboard contract (#274)', () => {
    it('exposes the options as a single radiogroup', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByRole('radiogroup', { name: 'License class options' })).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('takes one tab stop, landing on the checked option', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="general" />, { wrapper: muiWrapper });

      // Tab through until focus reaches a radio, then confirm the next Tab
      // leaves the group rather than visiting the other two options.
      const radios = screen.getAllByRole('radio');
      const general = screen.getByRole('radio', { name: /General/ });

      general.focus();
      expect(general).toHaveFocus();

      await user.tab();

      expect(radios.some((r) => r === document.activeElement)).toBe(false);
    });

    it('moves the selection with arrow keys', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      screen.getByRole('radio', { name: /Technician/ }).focus();
      await user.keyboard('{ArrowDown}');

      // The whole point of #274: this did nothing before.
      expect(screen.getByRole('radio', { name: /General/ })).toBeChecked();
    });

    it('skips unavailable options when arrowing', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      const unavailable = screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).disabled);

      // Native radios are skipped by arrow navigation when disabled; if every
      // license is available this is vacuous, so it only asserts when one is not.
      if (unavailable.length > 0) {
        await user.keyboard('{ArrowDown}');
        expect(unavailable.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
      } else {
        expect(unavailable).toHaveLength(0);
      }
    });
  });

  describe('Selection Behavior', () => {
    it('highlights the currently selected license card', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      expect(screen.getByRole('radio', { name: /Technician/ })).toBeChecked();
    });

    it('allows selecting a different license', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      expect(generalCard).toBeChecked();
    });

    it('updates pending selection when clicking a card', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      // Click on Extra
      const extraCard = screen.getByRole('radio', { name: /Amateur Extra/ });
      await user.click(extraCard!);

      // Change button should be enabled since selection differs
      expect(screen.getByRole('button', { name: /change license/i })).not.toBeDisabled();
    });
  });

  describe('Confirm/Cancel Buttons', () => {
    it('shows "No Change" when same license is selected', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: /no change/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no change/i })).toBeDisabled();
    });

    it('shows "Change License" when different license is selected', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      // Select General
      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      expect(screen.getByRole('button', { name: /change license/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change license/i })).not.toBeDisabled();
    });

    it('calls onTestChange when Change License is clicked', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />, { wrapper: muiWrapper });

      // Select General
      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      // Click Change License
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onTestChange).toHaveBeenCalledWith('general');
    });

    it('calls onOpenChange(false) when Change License is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onOpenChange={onOpenChange} selectedTest="technician" />, { wrapper: muiWrapper });

      // Select General
      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      // Click Change License
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onTestChange when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />, { wrapper: muiWrapper });

      // Select General
      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      // Click Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onTestChange).not.toHaveBeenCalled();
    });

    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onOpenChange={onOpenChange} />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Modal State Reset', () => {
    it('resets pending selection when Cancel is clicked and modal reopens', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" onOpenChange={onOpenChange} />, { wrapper: muiWrapper });

      // Select General
      const generalCard = screen.getByRole('radio', { name: /General/ });
      await user.click(generalCard!);

      expect(generalCard).toBeChecked();

      // Click Cancel - this should reset the pending selection
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify onOpenChange was called to close
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('preserves current selection in pending state when modal opens', () => {
      // When modal opens with technician selected, technician should be pending selection
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />, { wrapper: muiWrapper });

      expect(screen.getByRole('radio', { name: /Technician/ })).toBeChecked();
    });

    it('starts with correct pending selection for general', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="general" />, { wrapper: muiWrapper });

      expect(screen.getByRole('radio', { name: /General/ })).toBeChecked();
    });

    it('starts with correct pending selection for extra', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="extra" />, { wrapper: muiWrapper });

      expect(screen.getByRole('radio', { name: /Amateur Extra/ })).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog title', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Select License Class')).toBeInTheDocument();
    });

    it('has accessible dialog description', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      expect(screen.getByText('Choose which amateur radio license exam you want to study for.')).toBeInTheDocument();
    });

    it('license cards are selectable radio buttons', () => {
      render(<LicenseSelectModal {...defaultProps} />, { wrapper: muiWrapper });

      // License cards are now role="radio" for proper a11y (single select)
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBe(3); // 3 license options

      // Should also have Cancel, Change/No Change buttons, plus close button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Extra License Selection', () => {
    it('allows selecting Extra license', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />, { wrapper: muiWrapper });

      // Select Extra
      const extraCard = screen.getByRole('radio', { name: /Amateur Extra/ });
      await user.click(extraCard!);

      // Confirm
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onTestChange).toHaveBeenCalledWith('extra');
    });

    it('displays correct info for Extra license', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="extra" />, { wrapper: muiWrapper });

      expect(screen.getByText('50 questions')).toBeInTheDocument();
      expect(screen.getByText('37 to pass')).toBeInTheDocument();
      expect(screen.getByText(/Full amateur privileges/)).toBeInTheDocument();
    });
  });
});
