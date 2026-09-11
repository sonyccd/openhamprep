import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('ThemeToggle', () => {
  const renderWithTooltip = () => {
    return render(
      <TooltipProvider>
        <ThemeToggle />
      </TooltipProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
  });

  describe('Rendering', () => {
    it('renders a button', () => {
      renderWithTooltip();

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has correct aria-label for light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to dark theme'
      );
    });

    it('has correct aria-label for dark theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to light theme'
      );
    });
  });

  describe('Theme Switching', () => {
    it('switches from light to dark when clicked in light mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light when clicked in dark mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      await user.click(screen.getByRole('button'));

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  // These two keep their class assertions deliberately: sr-only is what makes
  // the label reach screen readers while staying invisible, so it is an
  // accessibility contract rather than styling. Dropping it would make the text
  // render on screen.
  describe('Screen Reader Support', () => {
    it('has sr-only text for light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      expect(screen.getByText('Switch to dark theme')).toHaveClass('sr-only');
    });

    it('has sr-only text for dark theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });

      renderWithTooltip();

      expect(screen.getByText('Switch to light theme')).toHaveClass('sr-only');
    });
  });
});
