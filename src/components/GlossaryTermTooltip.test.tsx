import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlossaryTermTooltip, GlossaryTermProvider } from './GlossaryTermTooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

const mockTerm = {
  id: '1',
  term: 'Antenna',
  definition: 'Device for transmitting/receiving radio waves',
};

const mockTerm2 = {
  id: '2',
  term: 'Band',
  definition: 'A range of frequencies',
};

describe('GlossaryTermTooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Behavior (Tooltip)', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(false);
    });

    it('renders children correctly', () => {
      render(
        <TooltipProvider>
          <GlossaryTermProvider>
            <GlossaryTermTooltip term={mockTerm}>
              <span>Antenna</span>
            </GlossaryTermTooltip>
          </GlossaryTermProvider>
        </TooltipProvider>
      );

      expect(screen.getByText('Antenna')).toBeInTheDocument();
    });

    it('uses Tooltip component on desktop', () => {
      render(
        <TooltipProvider>
          <GlossaryTermProvider>
            <GlossaryTermTooltip term={mockTerm}>
              <span>Antenna</span>
            </GlossaryTermTooltip>
          </GlossaryTermProvider>
        </TooltipProvider>
      );

      // Tooltip trigger should be rendered
      const trigger = screen.getByText('Antenna');
      expect(trigger).toBeInTheDocument();

      // Tooltip content is not visible until hover (Radix Tooltip)
      expect(screen.queryByText('Device for transmitting/receiving radio waves')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Behavior (Popover)', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    it('renders children correctly on mobile', () => {
      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Antenna</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      expect(screen.getByText('Antenna')).toBeInTheDocument();
    });

    it('shows popover on click for mobile', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Antenna</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      // Click the term
      await user.click(screen.getByText('Antenna'));

      // Popover content should be visible
      expect(screen.getByText('Device for transmitting/receiving radio waves')).toBeInTheDocument();
    });

    it('displays term name in popover', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Click me</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      await user.click(screen.getByText('Click me'));

      // Term name should be displayed with semibold styling
      const termName = screen.getByText('Antenna');
      expect(termName).toHaveClass('font-semibold');
    });

    it('closes popover when clicking the same term again', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Antenna</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      const trigger = screen.getByText('Antenna');

      // Open popover
      await user.click(trigger);
      expect(screen.getByText('Device for transmitting/receiving radio waves')).toBeInTheDocument();

      // Click trigger again to close
      await user.click(trigger);
      expect(screen.queryByText('Device for transmitting/receiving radio waves')).not.toBeInTheDocument();
    });

    it('only shows one popover at a time', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Antenna</span>
          </GlossaryTermTooltip>
          <GlossaryTermTooltip term={mockTerm2}>
            <span>Band</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      // Click first term
      await user.click(screen.getByText('Antenna'));
      expect(screen.getByText('Device for transmitting/receiving radio waves')).toBeInTheDocument();

      // Click second term - first should close, second should open
      await user.click(screen.getByText('Band'));
      expect(screen.queryByText('Device for transmitting/receiving radio waves')).not.toBeInTheDocument();
      expect(screen.getByText('A range of frequencies')).toBeInTheDocument();
    });
  });

  describe('GlossaryTermProvider', () => {
    it('provides context to child components', () => {
      vi.mocked(useIsMobile).mockReturnValue(true);

      // Should not throw when wrapped in provider
      expect(() =>
        render(
          <GlossaryTermProvider>
            <GlossaryTermTooltip term={mockTerm}>
              <span>Test</span>
            </GlossaryTermTooltip>
          </GlossaryTermProvider>
        )
      ).not.toThrow();
    });

    it('handles missing provider gracefully on mobile', async () => {
      vi.mocked(useIsMobile).mockReturnValue(true);
      const user = userEvent.setup();

      // Without provider, context is null but component should still render
      render(
        <GlossaryTermTooltip term={mockTerm}>
          <span>Antenna</span>
        </GlossaryTermTooltip>
      );

      expect(screen.getByText('Antenna')).toBeInTheDocument();

      // Clicking should still work (popover will be uncontrolled)
      await user.click(screen.getByText('Antenna'));
    });
  });

  describe('Content Styling', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true);
    });

    it('applies correct styling to term name', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Click</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      await user.click(screen.getByText('Click'));

      const termName = screen.getByText('Antenna');
      expect(termName).toHaveClass('font-semibold');
      expect(termName).toHaveClass('text-primary');
    });

    it('applies correct styling to definition', async () => {
      const user = userEvent.setup();

      render(
        <GlossaryTermProvider>
          <GlossaryTermTooltip term={mockTerm}>
            <span>Click</span>
          </GlossaryTermTooltip>
        </GlossaryTermProvider>
      );

      await user.click(screen.getByText('Click'));

      const definition = screen.getByText('Device for transmitting/receiving radio waves');
      expect(definition).toHaveClass('text-popover-foreground');
    });
  });
});
