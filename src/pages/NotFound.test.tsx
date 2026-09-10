import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntry = '/non-existent-page') => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <NotFound />
      </MemoryRouter>
    );
  };

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
