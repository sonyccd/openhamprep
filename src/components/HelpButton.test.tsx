import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpButton } from './HelpButton';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('HelpButton', () => {
  const renderHelpButton = () => {
    return render(
      <TooltipProvider>
        <HelpButton />
      </TooltipProvider>
    );
  };

  describe('Button Rendering', () => {
    it('renders the help button', () => {
      renderHelpButton();

      expect(screen.getByRole('button', { name: /open help dialog/i })).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      renderHelpButton();

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Open help dialog');
    });
  });

  describe('Dialog Behavior', () => {
    it('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows Help & Support title in dialog', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Help & Support')).toBeInTheDocument();
      });
    });

    it('shows description in dialog', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Keyboard shortcuts and ways to get help')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    it('shows Shortcuts tab by default', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
      });
    });

    it('displays shortcut groups', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Answering Questions')).toBeInTheDocument();
        expect(screen.getByText('Navigation')).toBeInTheDocument();
        expect(screen.getByText('Tools')).toBeInTheDocument();
      });
    });

    it('shows keyboard shortcuts', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByText('Select answer A')).toBeInTheDocument();
        expect(screen.getByText('Select answer B')).toBeInTheDocument();
        expect(screen.getByText('Next question')).toBeInTheDocument();
      });
    });

    it('switches to Feedback tab when clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /feedback/i }));

      await waitFor(() => {
        expect(screen.getByText('Report a Bug')).toBeInTheDocument();
        expect(screen.getByText('Request a Feature')).toBeInTheDocument();
      });
    });
  });

  describe('Feedback Links', () => {
    it('has correct bug report link', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /feedback/i }));

      await waitFor(() => {
        const bugLink = screen.getByRole('link', { name: /report a bug/i });
        expect(bugLink).toHaveAttribute(
          'href',
          'https://github.com/sonyccd/openhamprep/issues/new?template=bug_report.md'
        );
        expect(bugLink).toHaveAttribute('target', '_blank');
        expect(bugLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('has correct feature request link', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /feedback/i }));

      await waitFor(() => {
        const featureLink = screen.getByRole('link', { name: /request a feature/i });
        expect(featureLink).toHaveAttribute(
          'href',
          'https://github.com/sonyccd/openhamprep/issues/new?template=feature_request.md'
        );
        expect(featureLink).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Keyboard Shortcut Display', () => {
    it('displays keys in kbd elements', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        // Check that A, B, C, D keys are displayed
        const kbdElements = document.querySelectorAll('kbd');
        expect(kbdElements.length).toBeGreaterThan(0);
      });
    });
  });
});
