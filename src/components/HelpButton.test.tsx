import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpButton } from './HelpButton';
import { ThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';
import { useIsMobile } from '@/hooks/use-mobile';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('HelpButton', () => {
  // Default to desktop layout; the mobile suite overrides per-test.
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  const renderHelpButton = () => {
    return render(
      <ThemeProvider theme={muiTheme}>
        <HelpButton />
      </ThemeProvider>
    );
  };

  // Both the mobile (top-right) and desktop (floating) triggers live in the DOM
  // and CSS picks one. happy-dom evaluates the sx media queries at 1024px, so
  // only the desktop Fab is accessible here; the mobile one is display: none.
  const getHelpButton = () => screen.getByRole('button', { name: /open help dialog/i });

  describe('Button Rendering', () => {
    it('renders the help button', () => {
      renderHelpButton();

      expect(getHelpButton()).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      renderHelpButton();

      expect(getHelpButton()).toHaveAttribute('aria-label', 'Open help dialog');
    });
  });

  describe('Triggers', () => {
    it('shows one trigger at a time, the Fab at desktop width', () => {
      renderHelpButton();

      const all = screen.getAllByRole('button', { name: /open help dialog/i, hidden: true });
      expect(all).toHaveLength(2);
      expect(getHelpButton()).toHaveClass('MuiFab-root');
    });

    /** The same layer as the hamburger: over the page, under the drawer and dialogs. */
    it('floats below the drawer', () => {
      renderHelpButton();

      const z = Number(getComputedStyle(getHelpButton()).zIndex);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(muiTheme.zIndex.drawer);
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    it('opens the dialog when the mobile button is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('hides the keyboard Shortcuts tab and shows feedback options directly', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByText('Give Feedback')).toBeInTheDocument();
      });

      // No tab bar on mobile — keyboard shortcuts aren't relevant
      expect(screen.queryByRole('tab', { name: /shortcuts/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /feedback/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Answer Selection')).not.toBeInTheDocument();
    });
  });

  describe('Dialog Behavior', () => {
    it('opens dialog when button is clicked', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows Help & Support title in dialog', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByText('Help & Support')).toBeInTheDocument();
      });
    });

    it('removes the visible "Keyboard shortcuts" subtitle but keeps an sr-only description', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByText('Help & Support')).toBeInTheDocument();
      });

      // Old visible subtitle is gone...
      expect(screen.queryByText('Keyboard shortcuts and ways to get help')).not.toBeInTheDocument();
      // ...but a hidden description remains for screen readers
      expect(screen.getByText('Help resources and feedback options')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('shows Feedback tab by default', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /feedback/i })).toBeInTheDocument();
        expect(screen.getByText('Give Feedback')).toBeInTheDocument();
      });
    });

    it('displays shortcut groups when Shortcuts tab is selected', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

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

      await user.click(getHelpButton());

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

      await user.click(getHelpButton());

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

  describe('Tab wiring', () => {
    it('labels the panel by the selected tab', async () => {
      const user = userEvent.setup();
      renderHelpButton();
      await user.click(getHelpButton());

      const feedbackTab = await screen.findByRole('tab', { name: /feedback/i, selected: true });
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', feedbackTab.id);
      expect(feedbackTab).toHaveAttribute('aria-controls', panel.id);

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      const shortcutsTab = screen.getByRole('tab', { name: /shortcuts/i, selected: true });
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', shortcutsTab.id);
    });

    it('names and describes the dialog from its own text', async () => {
      const user = userEvent.setup();
      renderHelpButton();
      await user.click(getHelpButton());

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAccessibleName('Help & Support');
      expect(dialog).toHaveAccessibleDescription('Help resources and feedback options');
    });
  });

  describe('Feedback Options', () => {
    it('tells screen readers the status link opens a new window', async () => {
      const user = userEvent.setup();
      renderHelpButton();
      await user.click(getHelpButton());

      const link = await screen.findByRole('link', { name: /system status/i });
      expect(link).toHaveAccessibleName(/opens in new window/);
    });

    it('shows Report a Bug button', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });
    });

    it('shows Give Feedback button', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });
    });

    it('has correct status page link', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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

      await user.click(getHelpButton());
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
      await user.click(getHelpButton());
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /report a bug/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/title/i), 'Test title');
      await user.type(screen.getByLabelText(/description/i), 'Test description');

      await user.keyboard('{Escape}');
      // The dialog stays mounted through its exit transition, with the rest of
      // the page aria-hidden until it is gone.
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      await user.click(getHelpButton());

      // Should show options view, not the form
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /report a bug/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
      });

      // ...and the fields themselves are empty, not just hidden behind the options.
      await user.click(screen.getByRole('button', { name: /report a bug/i }));
      expect(await screen.findByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    /** Each form keeps its own draft while the dialog stays open. */
    it('keeps a bug draft while looking at the feedback form', async () => {
      const user = userEvent.setup();
      renderHelpButton();
      await user.click(getHelpButton());

      await user.click(await screen.findByRole('button', { name: /report a bug/i }));
      await user.type(await screen.findByLabelText(/title/i), 'Radio silence');
      await user.click(screen.getByRole('button', { name: /back to options/i }));

      await user.click(screen.getByRole('button', { name: /give feedback/i }));
      expect(await screen.findByLabelText(/title/i)).toHaveValue('');
      await user.click(screen.getByRole('button', { name: /back to options/i }));

      await user.click(screen.getByRole('button', { name: /report a bug/i }));
      expect(await screen.findByLabelText(/title/i)).toHaveValue('Radio silence');
    });
  });

  describe('Keyboard Shortcut Display', () => {
    it('displays keys in kbd elements when Shortcuts tab is selected', async () => {
      const user = userEvent.setup();
      renderHelpButton();

      await user.click(getHelpButton());

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /shortcuts/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /shortcuts/i }));

      await waitFor(() => {
        // The answer keys are listed as shortcuts.
        for (const key of ['A', 'B', 'C', 'D']) {
          expect(screen.getByText(key, { selector: 'kbd' })).toBeInTheDocument();
        }
      });
    });
  });
});
