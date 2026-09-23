import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';
import { muiWrapper } from '@/test/utils';

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntry = '/non-existent-page') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <NotFound />
      </MemoryRouter>,
      { wrapper: muiWrapper }
    );
  };

  describe('Theming', () => {
    /**
     * `muted` is one of this app's own palette keys. Without the real theme MUI
     * drops the declaration silently — an empty rule, no background — so this
     * asserts the token resolved rather than merely that the page rendered.
     */
    it('paints its background from the app palette', () => {
      const { container } = renderWithRouter();
      const outer = container.firstElementChild as HTMLElement;

      const cls = [...outer.classList].find((c) => c.startsWith('css-'));
      if (!cls) throw new Error(`no emotion class on the page root: ${outer.className}`);
      const rules = Array.from(document.styleSheets)
        .flatMap((sheet) => Array.from(sheet.cssRules))
        .map((rule) => rule.cssText.replace(/\s+/g, ' '))
        .filter((text) => text.includes(cls));
      expect(rules.join('\n')).toMatch(/background-color: var\(--mui-palette-muted\)/);
    });
  });

  describe('Display', () => {
    it('renders 404 heading', () => {
      renderWithRouter();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    });

    it('renders error message', () => {
      renderWithRouter();

      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    });

    it('renders return to home link', () => {
      renderWithRouter();

      const link = screen.getByRole('link', { name: /return to home/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('Logging', () => {
    it('logs error with pathname on mount', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter('/some-bad-route');

      expect(consoleSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/some-bad-route'
      );

      consoleSpy.mockRestore();
    });

    it('logs different pathname for different routes', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithRouter('/another-missing-page');

      expect(consoleSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/another-missing-page'
      );

      consoleSpy.mockRestore();
    });
  });

});
