import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';
import { PWAInstallBanner } from './PWAInstallBanner';

const mockTriggerInstall = vi.fn();
const mockDismissPrompt = vi.fn();

vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(),
}));

import { usePWAInstall } from '@/hooks/usePWAInstall';

const mockPrompt = (overrides: Partial<ReturnType<typeof usePWAInstall>> = {}) => {
  vi.mocked(usePWAInstall).mockReturnValue({
    showPrompt: true,
    isIOS: false,
    canInstall: true,
    isInstalled: false,
    triggerInstall: mockTriggerInstall,
    dismissPrompt: mockDismissPrompt,
    ...overrides,
  });
};

const renderBanner = () =>
  render(
    <ThemeProvider theme={muiTheme}>
      <PWAInstallBanner />
    </ThemeProvider>
  );

describe('PWAInstallBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrompt();
  });

  it('renders nothing while there is nothing to offer', () => {
    mockPrompt({ showPrompt: false, canInstall: false });

    renderBanner();

    expect(screen.queryByText('Install Open Ham Prep')).not.toBeInTheDocument();
  });

  describe('install banner', () => {
    it('shows the offer with both choices', () => {
      renderBanner();

      expect(screen.getByText('Install Open Ham Prep')).toBeInTheDocument();
      expect(screen.getByText('Quick access from your home screen')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
    });

    it('is a non-modal alertdialog named and described by its own text', () => {
      renderBanner();

      const banner = screen.getByRole('alertdialog');
      expect(banner).toHaveAccessibleName('Install Open Ham Prep');
      expect(banner).toHaveAccessibleDescription('Quick access from your home screen');
      expect(banner).toHaveAttribute('aria-modal', 'false');
    });

    it('takes focus on arrival', () => {
      vi.useFakeTimers();
      try {
        renderBanner();
        act(() => {
          vi.advanceTimersByTime(100);
        });

        expect(screen.getByRole('alertdialog')).toHaveFocus();
      } finally {
        vi.useRealTimers();
      }
    });

    /**
     * App always renders the banner, so dismissing hides it without an
     * unmount; the restore must not depend on one.
     */
    it('gives focus back to where it was once dismissed', () => {
      vi.useFakeTimers();
      try {
        mockPrompt({ showPrompt: false });
        const view = render(
          <ThemeProvider theme={muiTheme}>
            <button type="button">Somewhere on the page</button>
            <PWAInstallBanner />
          </ThemeProvider>
        );
        const origin = screen.getByRole('button', { name: 'Somewhere on the page' });
        origin.focus();

        mockPrompt();
        view.rerender(
          <ThemeProvider theme={muiTheme}>
            <button type="button">Somewhere on the page</button>
            <PWAInstallBanner />
          </ThemeProvider>
        );
        act(() => {
          vi.advanceTimersByTime(100);
        });
        expect(screen.getByRole('alertdialog')).toHaveFocus();

        mockPrompt({ showPrompt: false });
        view.rerender(
          <ThemeProvider theme={muiTheme}>
            <button type="button">Somewhere on the page</button>
            <PWAInstallBanner />
          </ThemeProvider>
        );

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(origin).toHaveFocus();
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves focus alone if the user had already moved on', () => {
      const view = render(
        <ThemeProvider theme={muiTheme}>
          <button type="button">Origin</button>
          <input aria-label="Callsign" />
          <PWAInstallBanner />
        </ThemeProvider>
      );
      screen.getByRole('button', { name: 'Origin' }).focus();
      const field = screen.getByRole('textbox', { name: 'Callsign' });
      field.focus();

      mockPrompt({ showPrompt: false });
      view.rerender(
        <ThemeProvider theme={muiTheme}>
          <button type="button">Origin</button>
          <input aria-label="Callsign" />
          <PWAInstallBanner />
        </ThemeProvider>
      );

      expect(field).toHaveFocus();
    });

    it('installs on Install', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: 'Install' }));

      expect(mockTriggerInstall).toHaveBeenCalledTimes(1);
    });

    it('dismisses on Not now', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: 'Not now' }));

      expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
    });

    it('dismisses on the close button', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: 'Dismiss install prompt' }));

      expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
    });

    it('dismisses on Escape', () => {
      renderBanner();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
    });

    /**
     * Snackbar positions itself in an sm media query, so a plain sx value would
     * lose at that width. Computed style covers happy-dom's 1024px viewport;
     * the emitted rule covers phones, which happy-dom cannot evaluate.
     */
    it('keeps its place above the mobile nav at every width', () => {
      renderBanner();
      const root = screen.getByRole('alertdialog').parentElement!;

      const style = getComputedStyle(root);
      expect(style.bottom).toBe('80px');
      expect(style.right).toBe('16px');
      expect(style.left).toBe('auto');

      const cls = [...root.classList].find((c) => c.startsWith('css-'));
      if (!cls) throw new Error(`no emotion class on snackbar root: ${root.className}`);
      const phoneRules = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .map((rule) => rule.cssText.replace(/\s+/g, ' '))
        .filter((text) => text.includes(cls) && text.startsWith('@media (min-width:0px)'));
      expect(phoneRules.join('\n')).toMatch(/bottom: 80px; right: 16px; left: 16px/);
    });

    it('sits below the drawer and dialogs', () => {
      renderBanner();
      const root = screen.getByRole('alertdialog').parentElement!;

      const z = Number(getComputedStyle(root).zIndex);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(muiTheme.zIndex.drawer);
    });

    /** An unanswered offer must survive the user carrying on with the page. */
    it('stays when the user clicks elsewhere', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(document.body);

      expect(mockDismissPrompt).not.toHaveBeenCalled();
    });
  });

  describe('iOS instructions', () => {
    beforeEach(() => mockPrompt({ isIOS: true }));

    it('walks through Share → Add to Home Screen', () => {
      renderBanner();

      const steps = screen.getByRole('list', { name: 'Installation steps' });
      expect(steps.tagName).toBe('OL');
      expect(steps).toHaveTextContent(/Tap the.*Share.*button in Safari/);
      expect(steps).toHaveTextContent(/Scroll down and tap.*Add to Home Screen/);
      expect(steps).toHaveTextContent(/Tap.*Add.*to confirm/);
    });

    it('is a dialog named and described by its own text', () => {
      renderBanner();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('Install Open Ham Prep');
      expect(dialog).toHaveAccessibleDescription('Add this app to your home screen for quick access');
    });

    it('dismisses on Got it', async () => {
      const user = userEvent.setup();
      renderBanner();

      await user.click(screen.getByRole('button', { name: 'Got it' }));

      expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
    });

    it('dismisses on Escape', () => {
      renderBanner();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(mockDismissPrompt).toHaveBeenCalledTimes(1);
    });
  });
});
