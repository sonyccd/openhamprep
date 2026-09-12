import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('ThemeToggle', () => {
  // MUI's Tooltip needs no provider, unlike the Radix one this replaced.
  const renderToggle = () => render(<ThemeToggle />);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });
  });

  describe('Rendering', () => {
    it('renders a button', () => {
      renderToggle();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('names itself for the theme it switches to, from light', () => {
      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
    });

    it('names itself for the theme it switches to, from dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      });

      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light theme');
    });

    it('reads as light before next-themes has resolved', () => {
      // resolvedTheme is undefined until mount. The pre-mount markup rendered
      // the sun, so light is the reading that matches it.
      mockUseTheme.mockReturnValue({
        theme: undefined,
        resolvedTheme: undefined,
        setTheme: mockSetTheme,
      });

      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
    });
  });

  // "system" is the default (App.tsx sets defaultTheme="system"), so this is
  // the state most users are actually in — and next-themes reports theme
  // "system" with resolvedTheme carrying the real light/dark. Reading `theme`
  // alone makes the button describe the wrong direction on a dark-mode OS.
  describe('System theme', () => {
    it('offers to switch to light when system resolves dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      });

      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to light theme');
    });

    it('offers to switch to dark when system resolves light', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        resolvedTheme: 'light',
        setTheme: mockSetTheme,
      });

      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
    });

    it('actually leaves dark mode when system resolves dark', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'system',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      });

      renderToggle();
      await user.click(screen.getByRole('button'));

      // Reading `theme` sent "dark" here, which is what the page already
      // rendered — the click did nothing the user could see.
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Theme Switching', () => {
    it('switches from light to dark when clicked in light mode', async () => {
      const user = userEvent.setup();

      renderToggle();

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light when clicked in dark mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        resolvedTheme: 'dark',
        setTheme: mockSetTheme,
      });

      renderToggle();

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  // The previous version carried both an aria-label and an sr-only span of the
  // same text. aria-label wins for the accessible name, so the span was neither
  // visible nor announced — it is gone, and these assert the property that
  // actually mattered: the button has a name, and the icons do not contribute
  // to it.
  describe('Accessible name', () => {
    it('takes its whole name from the label, not the icons', () => {
      renderToggle();

      expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme');
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});
