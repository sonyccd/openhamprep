import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilitySettings } from './AccessibilitySettings';
import { muiWrapper } from '@/test/utils';

const mockSetFontFamily = vi.fn();
const mockSetBoldText = vi.fn();
const mockSetLargeFont = vi.fn();
const mockUseAccessibility = vi.fn();

vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => mockUseAccessibility(),
}));

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccessibility.mockReturnValue({
      fontFamily: 'default',
      setFontFamily: mockSetFontFamily,
      boldText: false,
      setBoldText: mockSetBoldText,
      largeFont: false,
      setLargeFont: mockSetLargeFont,
    });
  });

  describe('Font choice', () => {
    it('offers each font', () => {
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'Default font' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OpenDyslexic font' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Arimo font' })).toBeInTheDocument();
    });

    it('marks the active font as pressed', () => {
      mockUseAccessibility.mockReturnValue({
        fontFamily: 'dyslexic',
        setFontFamily: mockSetFontFamily,
        boldText: false,
        setBoldText: mockSetBoldText,
        largeFont: false,
        setLargeFont: mockSetLargeFont,
      });

      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      expect(screen.getByRole('button', { name: 'OpenDyslexic font' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('names the font group', () => {
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      // Without aria-labelledby the group of toggles is announced with no
      // indication of what it selects — the same gap found on the category
      // Select in #286 and the goal sliders in #287.
      expect(screen.getByRole('group', { name: 'Font' })).toBeInTheDocument();
    });

    it('selects a font', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('button', { name: 'Arimo font' }));

      expect(mockSetFontFamily).toHaveBeenCalledWith('arimo');
    });

    it('ignores deselecting the active font', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      // Clicking the active button in an exclusive group reports null. Passing
      // that through would leave no font selected at all.
      await user.click(screen.getByRole('button', { name: 'Default font' }));

      expect(mockSetFontFamily).not.toHaveBeenCalled();
    });
  });

  describe('Toggles', () => {
    // MUI's Switch reports role="switch", as Radix's did — not "checkbox".
    it.each(['Bold All Text', 'Extra Large Text'])('labels the %s switch', (label) => {
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      expect(screen.getByRole('switch', { name: label })).toBeInTheDocument();
    });

    it('turns bold text on', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('switch', { name: 'Bold All Text' }));

      expect(mockSetBoldText).toHaveBeenCalledWith(true);
    });

    it('turns large text on', async () => {
      const user = userEvent.setup();
      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      await user.click(screen.getByRole('switch', { name: 'Extra Large Text' }));

      expect(mockSetLargeFont).toHaveBeenCalledWith(true);
    });

    it('reflects the current state', () => {
      mockUseAccessibility.mockReturnValue({
        fontFamily: 'default',
        setFontFamily: mockSetFontFamily,
        boldText: true,
        setBoldText: mockSetBoldText,
        largeFont: false,
        setLargeFont: mockSetLargeFont,
      });

      render(<AccessibilitySettings />, { wrapper: muiWrapper });

      expect(screen.getByRole('switch', { name: 'Bold All Text' })).toBeChecked();
      expect(screen.getByRole('switch', { name: 'Extra Large Text' })).not.toBeChecked();
    });
  });
});
