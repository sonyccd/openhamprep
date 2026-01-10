import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calculator } from './Calculator';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock Pendo
vi.mock('@/hooks/usePendo', () => ({
  usePendo: () => ({
    track: vi.fn(),
    isReady: true,
  }),
  PENDO_EVENTS: {
    CALCULATOR_OPENED: 'calculator_opened',
    CALCULATOR_USED: 'calculator_used',
  },
}));

describe('Calculator', () => {
  const renderCalculator = () => {
    return render(
      <TooltipProvider>
        <Calculator />
      </TooltipProvider>
    );
  };

  describe('Initial State', () => {
    it('renders calculator button', () => {
      renderCalculator();

      expect(screen.getByRole('button', { name: /open calculator/i })).toBeInTheDocument();
    });

    it('shows "Calculator" text when closed', () => {
      renderCalculator();

      expect(screen.getByText('Calculator')).toBeInTheDocument();
    });

    it('has aria-expanded false initially', () => {
      renderCalculator();

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Opening and Closing', () => {
    it('opens calculator when button clicked', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows calculator panel when open', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      // Should show display with "0" (using querySelector to avoid ambiguity with button)
      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('0');
    });

    it('closes calculator when clicked again', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      expect(screen.getByText('Close')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close calculator/i }));
      expect(screen.getByText('Calculator')).toBeInTheDocument();
    });

    it('has aria-expanded true when open', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      expect(screen.getByRole('button', { name: /close calculator/i })).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Number Input', () => {
    it('displays input digit in calculator display', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '5' }));

      // Check the display element specifically
      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('5');
    });

    it('appends digits', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));

      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('123');
    });

    it('handles decimal input', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: /decimal point/i }));
      await user.click(screen.getByRole('button', { name: '5' }));

      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('1.5');
    });

    it('prevents multiple decimals', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: /decimal point/i }));
      await user.click(screen.getByRole('button', { name: /decimal point/i }));
      await user.click(screen.getByRole('button', { name: '5' }));

      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('1.5');
    });
  });

  describe('Arithmetic Operations', () => {
    it('can click operation buttons', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      // Should be able to click operation buttons without error
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: /add/i }));
      await user.click(screen.getByRole('button', { name: '3' }));
      await user.click(screen.getByRole('button', { name: /equals/i }));

      // Calculator should still be open
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Clear Function', () => {
    it('clears display when C pressed', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      await user.click(screen.getByRole('button', { name: /clear/i }));

      // The display shows 0 after clear
      const display = document.querySelector('.font-mono.text-xl');
      expect(display?.textContent).toBe('0');
    });
  });

  describe('Button Layout', () => {
    it('displays all number buttons', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
      }
    });

    it('displays all operation buttons', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subtract/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /multiply/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /divide/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /equals/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('displays decimal button', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      expect(screen.getByRole('button', { name: /decimal point/i })).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      render(
        <TooltipProvider>
          <Calculator className="custom-class" />
        </TooltipProvider>
      );

      // The wrapper div should have the custom class
      const wrapper = screen.getByRole('button').parentElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
