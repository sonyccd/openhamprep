import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { muiWrapper } from '@/test/utils';

describe('KeyboardShortcutsHelp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Trigger', () => {
    it('renders a labelled trigger button', () => {
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    });

    it('omits the trigger when showTrigger is false', () => {
      render(<KeyboardShortcutsHelp showTrigger={false} />, { wrapper: muiWrapper });

      expect(screen.queryByRole('button', { name: 'Keyboard shortcuts' })).not.toBeInTheDocument();
    });

    it('opens the dialog when the trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

      expect(screen.getByRole('dialog', { name: /Keyboard Shortcuts/ })).toBeInTheDocument();
    });
  });

  // The checklist for this port calls out the dismiss contract specifically,
  // because it is the part that silently changes when swapping dialog vendors.
  describe('Dismiss contract', () => {
    it('closes on Escape', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });
      await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

      await user.keyboard('{Escape}');

      // waitFor because MUI fades the dialog out — the node stays mounted for
      // the duration of the exit transition, unlike Radix's immediate unmount.
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes on backdrop click', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });
      await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

      // MUI renders the backdrop as a sibling of the dialog paper; Radix's
      // onOpenChange(false) covered this case and MUI's onClose does too.
      await user.click(document.querySelector('.MuiBackdrop-root')!);

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('moves focus into the dialog when it opens', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  describe('The ? shortcut', () => {
    it('opens the dialog', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp />, { wrapper: muiWrapper });

      await user.keyboard('?');

      expect(screen.getByRole('dialog', { name: /Keyboard Shortcuts/ })).toBeInTheDocument();
    });

    it('is ignored while typing in a text field', async () => {
      const user = userEvent.setup();
      render(
        <>
          <input aria-label="somewhere to type" />
          <KeyboardShortcutsHelp />
        </>,
        { wrapper: muiWrapper }
      );

      await user.click(screen.getByRole('textbox', { name: 'somewhere to type' }));
      await user.keyboard('?');

      // A question mark belongs in the field, not in a shortcut.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('is controllable from outside', () => {
      render(<KeyboardShortcutsHelp open onOpenChange={vi.fn()} showTrigger={false} />, {
        wrapper: muiWrapper,
      });

      expect(screen.getByRole('dialog', { name: /Keyboard Shortcuts/ })).toBeInTheDocument();
    });

    it('reports the dialog to assistive tech with a description', () => {
      render(<KeyboardShortcutsHelp open onOpenChange={vi.fn()} showTrigger={false} />, {
        wrapper: muiWrapper,
      });

      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
        /navigate and answer questions faster/
      );
    });

    it('lists every shortcut group', () => {
      render(<KeyboardShortcutsHelp open onOpenChange={vi.fn()} showTrigger={false} />, {
        wrapper: muiWrapper,
      });

      const dialog = screen.getByRole('dialog');
      for (const group of ['Answering Questions', 'Navigation', 'Tools']) {
        expect(within(dialog).getByRole('heading', { name: group })).toBeInTheDocument();
      }
    });

    it('pairs each shortcut with its key', () => {
      render(<KeyboardShortcutsHelp open onOpenChange={vi.fn()} showTrigger={false} />, {
        wrapper: muiWrapper,
      });

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Select answer A')).toBeInTheDocument();
      expect(within(dialog).getByText('Skip question (Random Practice)')).toBeInTheDocument();
    });
  });
});
