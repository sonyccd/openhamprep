import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calculator } from './Calculator';
import { ThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';

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
      <ThemeProvider theme={muiTheme}>
        <Calculator />
      </ThemeProvider>
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

      const display = screen.getByLabelText('Calculator display');
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

      const display = screen.getByLabelText('Calculator display');
      expect(display?.textContent).toBe('5');
    });

    it('appends digits', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));

      const display = screen.getByLabelText('Calculator display');
      expect(display?.textContent).toBe('123');
    });

    it('handles decimal input', async () => {
      const user = userEvent.setup();
      renderCalculator();

      await user.click(screen.getByRole('button', { name: /open calculator/i }));
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: /decimal point/i }));
      await user.click(screen.getByRole('button', { name: '5' }));

      const display = screen.getByLabelText('Calculator display');
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

      const display = screen.getByLabelText('Calculator display');
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
      const display = screen.getByLabelText('Calculator display');
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

  describe('layering and layout', () => {
    /**
     * Read the emitted stylesheet rather than computed style: happy-dom
     * evaluates media queries at 1024px, so a computed margin would only
     * show the desktop value and could not catch a missing breakpoint rule.
     */
    const rulesFor = (el: HTMLElement, needle: string) => {
      const cls = [...el.classList].find((c) => c.startsWith('css-'))!;
      const out: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule.cssText.includes(cls) && rule.cssText.includes(needle)) out.push(rule.cssText);
        }
      }
      return out.join('\n');
    };

    it('restores the icon-to-label gap at sm and up', () => {
      renderCalculator();
      const css = rulesFor(screen.getByRole('button', { name: /open calculator/i }), 'startIcon');

      expect(css).toMatch(/min-width:0px[^}]*startIcon[^}]*margin-right: 0px/);
      // One spacing unit; the theme emits it as a CSS variable, not a literal.
      expect(css).toMatch(/min-width:640px[^}]*startIcon[^}]*margin-right: var\(--mui-spacing\)/);
    });

    it('sits below dialogs and the drawer', async () => {
      const user = userEvent.setup();
      renderCalculator();
      await user.click(screen.getByRole('button', { name: /open calculator/i }));

      const panel = screen.getByRole('status').parentElement!;
      const z = Number(getComputedStyle(panel).zIndex);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(muiTheme.zIndex.appBar);
    });
  });
});
