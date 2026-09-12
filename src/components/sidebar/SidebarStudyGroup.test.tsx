import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarStudyGroup } from './SidebarStudyGroup';
import { muiWrapper } from '@/test/utils';
import { GraduationCap, Zap, BookOpen, AlertTriangle, Bookmark } from 'lucide-react';
import type { NavGroup } from './types';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(component, { wrapper: muiWrapper });
};

const createStudyGroup = (overrides?: Partial<NavGroup>): NavGroup => ({
  id: 'study',
  label: 'Study',
  icon: GraduationCap,
  items: [
    { id: 'random-practice', label: 'Random Practice', icon: Zap },
    { id: 'subelement-practice', label: 'By Subelement', icon: BookOpen },
    { id: 'weak-questions', label: 'Weak Areas', icon: AlertTriangle, badge: 5 },
    { id: 'bookmarks', label: 'Bookmarked', icon: Bookmark, badge: 3 },
  ],
  ...overrides,
});

describe('SidebarStudyGroup', () => {
  const defaultProps = {
    group: createStudyGroup(),
    currentView: 'dashboard' as const,
    isOnAdminPage: false,
    isExpanded: true,
    showExpanded: true,
    onToggle: vi.fn(),
    onNavClick: vi.fn(),
  };

  it('renders group label when expanded', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} />);
    expect(screen.getByText('Study')).toBeInTheDocument();
  });

  // Nothing covered this before, and the port swapped its mechanism: the
  // count bubble is aria-hidden and the number reaches assistive tech as
  // separate hidden text, which was Tailwind's sr-only class and is now MUI's
  // visuallyHidden. A silent loss there would take the count away from screen
  // reader users while looking identical on screen.
  describe('badge announcements', () => {
    it('announces the total on the group header', () => {
      renderWithTooltip(<SidebarStudyGroup {...defaultProps} />);

      // 5 weak areas + 3 bookmarks.
      expect(screen.getByRole('button', { name: /Study/ })).toHaveAccessibleName(
        /8 items need attention/
      );
    });

    it('announces each item count', () => {
      renderWithTooltip(<SidebarStudyGroup {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Weak Areas/ })).toHaveAccessibleName(
        /5 items/
      );
    });

    it('uses the supplied wording when given', () => {
      const group = createStudyGroup({
        items: [
          {
            id: 'weak-questions',
            label: 'Weak Areas',
            icon: AlertTriangle,
            badge: 1,
            badgeAriaLabel: '1 weak question',
          },
        ],
      });
      renderWithTooltip(<SidebarStudyGroup {...defaultProps} group={group} />);

      expect(screen.getByRole('button', { name: /Weak Areas/ })).toHaveAccessibleName(
        /1 weak question/
      );
    });

    it('says nothing when there is nothing to report', () => {
      const group = createStudyGroup({
        items: [{ id: 'random-practice', label: 'Random Practice', icon: Zap }],
      });
      renderWithTooltip(<SidebarStudyGroup {...defaultProps} group={group} />);

      expect(screen.getByRole('button', { name: /Study/ })).not.toHaveAccessibleName(
        /items need attention/
      );
    });
  });

  it('renders all study items when expanded', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Random Practice')).toBeInTheDocument();
    expect(screen.getByText('By Subelement')).toBeInTheDocument();
    expect(screen.getByText('Weak Areas')).toBeInTheDocument();
    expect(screen.getByText('Bookmarked')).toBeInTheDocument();
  });

  it('hides study items when collapsed', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText('Random Practice')).not.toBeInTheDocument();
    expect(screen.queryByText('By Subelement')).not.toBeInTheDocument();
  });

  it('calls onToggle when header is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} onToggle={onToggle} />);

    const header = screen.getByText('Study');
    await user.click(header);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onNavClick when a study item is clicked', async () => {
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    renderWithTooltip(
      <SidebarStudyGroup {...defaultProps} isExpanded={true} onNavClick={onNavClick} />
    );

    const item = screen.getByText('Random Practice');
    await user.click(item);

    expect(onNavClick).toHaveBeenCalledWith('random-practice', undefined);
  });

  it('shows total badge count on header', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} />);
    // Total badge: 5 + 3 = 8
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('shows 9+ when total badge exceeds 9', () => {
    const group = createStudyGroup({
      items: [
        { id: 'weak-questions', label: 'Weak Areas', icon: AlertTriangle, badge: 15 },
      ],
    });
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} group={group} isExpanded={false} />);
    // When collapsed (isExpanded=false), only the header badge is shown
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('applies active style to current view item', () => {
    renderWithTooltip(
      <SidebarStudyGroup
        {...defaultProps}
        currentView="random-practice"
        isExpanded={true}
      />
    );
    expect(screen.getByText('Random Practice').closest('button')).toHaveAttribute('aria-current', 'page');
  });

  it('does not apply active style when on admin page', () => {
    renderWithTooltip(
      <SidebarStudyGroup
        {...defaultProps}
        currentView="random-practice"
        isOnAdminPage={true}
        isExpanded={true}
      />
    );
    expect(screen.getByText('Random Practice').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('disables items marked as disabled', () => {
    const group = createStudyGroup({
      items: [
        { id: 'random-practice', label: 'Random Practice', icon: Zap, disabled: true },
      ],
    });
    renderWithTooltip(
      <SidebarStudyGroup {...defaultProps} group={group} isExpanded={true} />
    );
    const button = screen.getByText('Random Practice').closest('button');
    expect(button).toBeDisabled();
  });

  it('shows item badge when present', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} isExpanded={true} />);
    // Individual badges should be visible (5 for weak, 3 for bookmarks)
    const badges = screen.getAllByText(/^[0-9]+$/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders collapsed view with icon only', () => {
    renderWithTooltip(<SidebarStudyGroup {...defaultProps} showExpanded={false} />);
    // Should only show the icon button, not the full label
    expect(screen.queryByText('Study')).not.toBeInTheDocument();
    // But there should still be a button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
