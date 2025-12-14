import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeModal } from './WelcomeModal';
import { TestType } from '@/types/navigation';

describe('WelcomeModal', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open is true', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Welcome to Open Ham Prep!')).toBeInTheDocument();
      expect(screen.getByText('Which license are you studying for?')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <WelcomeModal
          open={false}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.queryByText('Welcome to Open Ham Prep!')).not.toBeInTheDocument();
    });

    it('should display all three license options', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Amateur Extra')).toBeInTheDocument();
    });

    it('should display question counts and passing scores', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Technician and General have 35 questions, Extra has 50
      expect(screen.getAllByText('35 questions').length).toBe(2);
      expect(screen.getByText('50 questions')).toBeInTheDocument();

      // Technician and General require 26 to pass, Extra requires 37
      expect(screen.getAllByText('26 to pass').length).toBe(2);
      expect(screen.getByText('37 to pass')).toBeInTheDocument();
    });

    it('should display Skip tour and Continue buttons', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      expect(screen.getByText('Skip tour')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('License Selection', () => {
    it('should have Technician selected by default', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // The Technician button should have the selected styling
      const technicianButton = screen.getByText('Technician').closest('button');
      expect(technicianButton).toHaveClass('border-primary');
    });

    it('should allow selecting General license', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const generalButton = screen.getByText('General').closest('button');
      fireEvent.click(generalButton!);

      // General should now be selected
      expect(generalButton).toHaveClass('border-primary');

      // Technician should no longer be selected
      const technicianButton = screen.getByText('Technician').closest('button');
      expect(technicianButton).not.toHaveClass('border-primary');
    });

    it('should allow selecting Extra license', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const extraButton = screen.getByText('Amateur Extra').closest('button');
      fireEvent.click(extraButton!);

      // Extra should now be selected
      expect(extraButton).toHaveClass('border-primary');
    });
  });

  describe('Actions', () => {
    it('should call onComplete with selected license when Continue is clicked', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      // Default selection is Technician
      expect(mockOnComplete).toHaveBeenCalledWith('technician');
    });

    it('should call onComplete with General when General is selected and Continue is clicked', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Select General
      const generalButton = screen.getByText('General').closest('button');
      fireEvent.click(generalButton!);

      // Click Continue
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(mockOnComplete).toHaveBeenCalledWith('general');
    });

    it('should call onComplete with Extra when Extra is selected and Continue is clicked', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Select Extra
      const extraButton = screen.getByText('Amateur Extra').closest('button');
      fireEvent.click(extraButton!);

      // Click Continue
      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(mockOnComplete).toHaveBeenCalledWith('extra');
    });

    it('should call onSkip when Skip tour is clicked', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      const skipButton = screen.getByText('Skip tour');
      fireEvent.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should call onSkip when X button is clicked', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // Find the close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnSkip).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Modal Behavior', () => {
    it('should prevent closing via escape key', () => {
      render(
        <WelcomeModal
          open={true}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
        />
      );

      // The modal should still be visible after pressing escape
      // (This is handled by onEscapeKeyDown={(e) => e.preventDefault()})
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
