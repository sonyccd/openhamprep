import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NavLink } from './NavLink';

describe('NavLink', () => {
  const renderNavLink = (to: string, currentPath: string, props?: Partial<React.ComponentProps<typeof NavLink>>) => {
    return render(
      <MemoryRouter initialEntries={[currentPath]}>
        <NavLink
          to={to}
          className="base-class"
          activeClassName="active-class"
          pendingClassName="pending-class"
          {...props}
        >
          Link Text
        </NavLink>
        <Routes>
          <Route path="*" element={<div>Page Content</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Basic Rendering', () => {
    it('renders as a link', () => {
      renderNavLink('/test', '/');

      expect(screen.getByRole('link', { name: 'Link Text' })).toBeInTheDocument();
    });

    it('renders with href', () => {
      renderNavLink('/test', '/');

      expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
    });

    it('renders children', () => {
      renderNavLink('/test', '/');

      expect(screen.getByText('Link Text')).toBeInTheDocument();
    });
  });

  describe('Class Names', () => {
    it('applies base className', () => {
      renderNavLink('/test', '/');

      expect(screen.getByRole('link')).toHaveClass('base-class');
    });

    it('applies activeClassName when route is active', () => {
      renderNavLink('/test', '/test');

      expect(screen.getByRole('link')).toHaveClass('active-class');
    });

    it('does not apply activeClassName when route is not active', () => {
      renderNavLink('/test', '/other');

      expect(screen.getByRole('link')).not.toHaveClass('active-class');
    });

    it('combines base and active classes when active', () => {
      renderNavLink('/test', '/test');

      const link = screen.getByRole('link');
      expect(link).toHaveClass('base-class');
      expect(link).toHaveClass('active-class');
    });
  });

  describe('Without Optional Props', () => {
    it('works without className', () => {
      render(
        <MemoryRouter>
          <NavLink to="/test">Link</NavLink>
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument();
    });

    it('works without activeClassName', () => {
      render(
        <MemoryRouter initialEntries={['/test']}>
          <NavLink to="/test" className="base">Link</NavLink>
        </MemoryRouter>
      );

      expect(screen.getByRole('link')).toHaveClass('base');
    });
  });

  describe('Forwarded Ref', () => {
    it('has correct displayName', () => {
      expect(NavLink.displayName).toBe('NavLink');
    });
  });
});
