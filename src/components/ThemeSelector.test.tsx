import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSelector } from './ThemeSelector';

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

describe('ThemeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme });
  });

  it('offers all three theme settings', () => {
    render(<ThemeSelector />);

    expect(screen.getByRole('button', { name: 'Light theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System theme' })).toBeInTheDocument();
  });

  it('marks the current setting as pressed', () => {
    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme });

    render(<ThemeSelector />);

    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('shows "system" as a selectable setting in its own right', () => {
    render(<ThemeSelector />);

    // Unlike ThemeToggle, this control reports the stored preference, so
    // "system" is a state it must be able to display rather than resolve away.
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('falls back to system when no preference is stored yet', () => {
    mockUseTheme.mockReturnValue({ theme: undefined, setTheme: mockSetTheme });

    render(<ThemeSelector />);

    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it.each([
    ['Light theme', 'light'],
    ['Dark theme', 'dark'],
    ['System theme', 'system'],
  ])('selects %s', async (name, expected) => {
    const user = userEvent.setup();
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme });

    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name }));

    if (expected === 'light') {
      // Clicking the active button in an exclusive group deselects it, which
      // reports null — the component ignores that rather than clearing the
      // theme and leaving no setting at all.
      expect(mockSetTheme).not.toHaveBeenCalled();
    } else {
      expect(mockSetTheme).toHaveBeenCalledWith(expected);
    }
  });
});
