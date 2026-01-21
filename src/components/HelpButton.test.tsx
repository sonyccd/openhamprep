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
    it('shows Feedback tab by default', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
        expect(screen.getByText('Give Feedback')).toBeInTheDocument();
      });
    });

    it('displays shortcut groups when Shortcuts tab is selected', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      await waitFor(() => {
        expect(screen.getByText('Answer Selection')).toBeInTheDocument();
        expect(screen.getByText('Navigation')).toBeInTheDocument();
      });
    });

    it('shows keyboard shortcuts when Shortcuts tab is selected', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      await waitFor(() => {
        expect(screen.getByText('Answer A')).toBeInTheDocument();
        expect(screen.getByText('Answer B')).toBeInTheDocument();
        expect(screen.getByText('Next question')).toBeInTheDocument();
      });
    });

    it('switches to Shortcuts tab when clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      await waitFor(() => {
        expect(screen.getByText('Answer Selection')).toBeInTheDocument();
        expect(screen.getByText('Navigation')).toBeInTheDocument();
      });
    });
  });

  describe('Feedback Options', () => {
    it('shows Report a Bug button', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });
    });

    it('shows Give Feedback button', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });
    });

    it('has correct status page link', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        const statusLink = screen.getByRole('link', { name: /system status/i });
        expect(statusLink).toHaveAttribute(
          'href',
          'https://status.openhamprep.com/status/openhamprep'
        );
        expect(statusLink).toHaveAttribute('target', '_blank');
        expect(statusLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Bug Report Form', () => {
    it('shows bug report form when Report a Bug is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit to forum/i })).toBeInTheDocument();
      });
    });

    it('shows back button in bug report form', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to options/i })).toBeInTheDocument();
      });
    });

    it('returns to options when back button is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to options/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back to options/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });
    });

    it('disables submit when title is empty', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit to forum/i })).toBeDisabled();
      });
    });

    it('disables submit when description is empty', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test bug title');

      expect(screen.getByRole('button', { name: /submit to forum/i })).toBeDisabled();
    });

    it('enables submit when both title and description have content', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test bug title');
      await user.type(screen.getByLabelText(/description/i), 'Test bug description');

      expect(screen.getByRole('button', { name: /submit to forum/i })).not.toBeDisabled();
    });

    it('opens forum URL when submit is clicked', async () => {
      const mockWindow = {} as Window;
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => mockWindow);
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test bug');
      await user.type(screen.getByLabelText(/description/i), 'Bug description');
      await user.click(screen.getByRole('button', { name: /submit to forum/i }));

      expect(windowOpenSpy).toHaveBeenCalledOnce();
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/forum\.openhamprep\.com\/new-topic.*tags=bug/),
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('resets form after submit', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test bug');
      await user.type(screen.getByLabelText(/description/i), 'Bug description');
      await user.click(screen.getByRole('button', { name: /submit to forum/i }));

      // Form should reset and return to options view after submit
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });

      windowOpenSpy.mockRestore();
    });
  });

  describe('Feedback Form', () => {
    it('shows feedback form when Give Feedback is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /give feedback/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit to forum/i })).toBeInTheDocument();
      });
    });

    it('opens forum URL with feature tag when feedback is submitted', async () => {
      const mockWindow = {} as Window;
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => mockWindow);
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /give feedback/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Feature idea');
      await user.type(screen.getByLabelText(/description/i), 'Feature description');
      await user.click(screen.getByRole('button', { name: /submit to forum/i }));

      expect(windowOpenSpy).toHaveBeenCalledOnce();
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/forum\.openhamprep\.com\/new-topic.*tags=feature/),
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });
  });

  describe('Form Reset', () => {
    it('resets form when dialog is closed', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      // Open dialog and fill bug form
      await user.click(screen.getByRole('button', { name: /open help dialog/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test title');
      await user.type(screen.getByLabelText(/description/i), 'Test description');

      // Close dialog by clicking outside or pressing escape
      await user.keyboard('{Escape}');

      // Re-open dialog
      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      // Should show options view, not the form
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcut Display', () => {
    it('displays keys in kbd elements when Shortcuts tab is selected', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(screen.getByRole('button', { name: /open help dialog/i }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      await waitFor(() => {
        // Check that A, B, C, D keys are displayed
        const kbdElements = document.querySelectorAll('kbd');
        expect(kbdElements.length).toBeGreaterThan(0);
      });
    });
  });
});
