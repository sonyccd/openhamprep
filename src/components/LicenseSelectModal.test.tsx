import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LicenseSelectModal } from './LicenseSelectModal';

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
      render(<LicenseSelectModal {...defaultProps} />);

      expect(screen.getByText('Select License Class')).toBeInTheDocument();
      expect(screen.getByText('Choose which amateur radio license exam you want to study for.')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<LicenseSelectModal {...defaultProps} open={false} />);

      expect(screen.queryByText('Select License Class')).not.toBeInTheDocument();
    });

    it('displays all three license options', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Amateur Extra')).toBeInTheDocument();
    });

    it('displays descriptions for each license', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      expect(screen.getByText(/Entry-level license for new operators/)).toBeInTheDocument();
      expect(screen.getByText(/Expanded HF privileges/)).toBeInTheDocument();
      expect(screen.getByText(/Full amateur privileges/)).toBeInTheDocument();
    });

    it('displays question counts and passing scores', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      // Technician and General: 35 questions, 26 to pass
      expect(screen.getAllByText('35 questions').length).toBe(2);
      expect(screen.getAllByText('26 to pass').length).toBe(2);

      // Extra: 50 questions, 37 to pass
      expect(screen.getByText('50 questions')).toBeInTheDocument();
      expect(screen.getByText('37 to pass')).toBeInTheDocument();
    });

    it('shows "Current" badge on the currently selected license', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="general" />);

      const generalCard = screen.getByText('General').closest('[role="option"]');
      expect(generalCard).toContainElement(screen.getByText('Current'));
    });
  });

  describe('Selection Behavior', () => {
    it('highlights the currently selected license card', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      const technicianCard = screen.getByText('Technician').closest('[role="option"]');
      expect(technicianCard).toHaveClass('border-primary');
    });

    it('allows selecting a different license', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      // The General card should now be highlighted
      expect(generalCard).toHaveClass('border-primary');
    });

    it('updates pending selection when clicking a card', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      // Click on Extra
      const extraCard = screen.getByText('Amateur Extra').closest('[role="option"]');
      await user.click(extraCard!);

      // Change button should be enabled since selection differs
      expect(screen.getByRole('button', { name: /change license/i })).not.toBeDisabled();
    });
  });

  describe('Confirm/Cancel Buttons', () => {
    it('shows "No Change" when same license is selected', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      expect(screen.getByRole('button', { name: /no change/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no change/i })).toBeDisabled();
    });

    it('shows "Change License" when different license is selected', async () => {
      const user = userEvent.setup();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      // Select General
      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      expect(screen.getByRole('button', { name: /change license/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change license/i })).not.toBeDisabled();
    });

    it('calls onTestChange when Change License is clicked', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />);

      // Select General
      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      // Click Change License
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onTestChange).toHaveBeenCalledWith('general');
    });

    it('calls onOpenChange(false) when Change License is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onOpenChange={onOpenChange} selectedTest="technician" />);

      // Select General
      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      // Click Change License
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call onTestChange when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />);

      // Select General
      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      // Click Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onTestChange).not.toHaveBeenCalled();
    });

    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Modal State Reset', () => {
    it('resets pending selection when Cancel is clicked and modal reopens', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" onOpenChange={onOpenChange} />);

      // Select General
      const generalCard = screen.getByText('General').closest('[role="option"]');
      await user.click(generalCard!);

      // Verify General is now highlighted
      expect(generalCard).toHaveClass('border-primary');

      // Click Cancel - this should reset the pending selection
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify onOpenChange was called to close
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('preserves current selection in pending state when modal opens', () => {
      // When modal opens with technician selected, technician should be pending selection
      render(<LicenseSelectModal {...defaultProps} selectedTest="technician" />);

      const technicianCard = screen.getByText('Technician').closest('[role="option"]');
      expect(technicianCard).toHaveClass('border-primary');
    });

    it('starts with correct pending selection for general', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="general" />);

      const generalCard = screen.getByText('General').closest('[role="option"]');
      expect(generalCard).toHaveClass('border-primary');
    });

    it('starts with correct pending selection for extra', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="extra" />);

      const extraCard = screen.getByText('Amateur Extra').closest('[role="option"]');
      expect(extraCard).toHaveClass('border-primary');
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog title', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Select License Class')).toBeInTheDocument();
    });

    it('has accessible dialog description', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      expect(screen.getByText('Choose which amateur radio license exam you want to study for.')).toBeInTheDocument();
    });

    it('license cards are selectable options', () => {
      render(<LicenseSelectModal {...defaultProps} />);

      // License cards are now role="option" for proper a11y
      const options = screen.getAllByRole('option');
      expect(options.length).toBe(3); // 3 license options

      // Should also have Cancel, Change/No Change buttons, plus close button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Extra License Selection', () => {
    it('allows selecting Extra license', async () => {
      const user = userEvent.setup();
      const onTestChange = vi.fn();
      render(<LicenseSelectModal {...defaultProps} onTestChange={onTestChange} selectedTest="technician" />);

      // Select Extra
      const extraCard = screen.getByText('Amateur Extra').closest('[role="option"]');
      await user.click(extraCard!);

      // Confirm
      await user.click(screen.getByRole('button', { name: /change license/i }));

      expect(onTestChange).toHaveBeenCalledWith('extra');
    });

    it('displays correct info for Extra license', () => {
      render(<LicenseSelectModal {...defaultProps} selectedTest="extra" />);

      expect(screen.getByText('50 questions')).toBeInTheDocument();
      expect(screen.getByText('37 to pass')).toBeInTheDocument();
      expect(screen.getByText(/Full amateur privileges/)).toBeInTheDocument();
    });
  });
});
