import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarLearnGroup } from './SidebarLearnGroup';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BookOpen, Route, GraduationCap } from 'lucide-react';
import type { NavGroup } from './types';

const renderWithTooltip = (component: React.ReactNode) => {
  return render(<TooltipProvider>{component}</TooltipProvider>);
};

const createLearnGroup = (overrides?: Partial<NavGroup>): NavGroup => ({
  id: 'learn',
  label: 'Learn',
  icon: GraduationCap,
  items: [
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'lessons', label: 'Lessons', icon: Route },
  ],
  ...overrides,
});

describe('SidebarLearnGroup', () => {
  const defaultProps = {
    group: createLearnGroup(),
    currentView: 'dashboard' as const,
    isOnAdminPage: false,
    isExpanded: true,
    showExpanded: true,
    onToggle: vi.fn(),
    onNavClick: vi.fn(),
  };

  it('renders group label when expanded', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} />);
    expect(screen.getByText('Learn')).toBeInTheDocument();
  });

  it('renders all learn items when expanded', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Lessons')).toBeInTheDocument();
  });

  it('hides learn items when collapsed', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText('Topics')).not.toBeInTheDocument();
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument();
  });

  it('calls onToggle when header is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} onToggle={onToggle} />);

    const header = screen.getByText('Learn');
    await user.click(header);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onNavClick when a learn item is clicked', async () => {
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    renderWithTooltip(
      <SidebarLearnGroup {...defaultProps} isExpanded={true} onNavClick={onNavClick} />
    );

    const item = screen.getByText('Topics');
    await user.click(item);

    expect(onNavClick).toHaveBeenCalledWith('topics', undefined);
  });

  it('calls onNavClick with Lessons item', async () => {
    const user = userEvent.setup();
    const onNavClick = vi.fn();
    renderWithTooltip(
      <SidebarLearnGroup {...defaultProps} isExpanded={true} onNavClick={onNavClick} />
    );

    const item = screen.getByText('Lessons');
    await user.click(item);

    expect(onNavClick).toHaveBeenCalledWith('lessons', undefined);
  });

  it('applies active style when topics view is active', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="topics"
        isExpanded={true}
      />
    );
    const button = screen.getByText('Topics').closest('button');
    expect(button?.className).toContain('bg-primary/10');
  });

  it('applies active style when topic-detail view is active (treated as topics)', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="topic-detail"
        isExpanded={true}
      />
    );
    const button = screen.getByText('Topics').closest('button');
    expect(button?.className).toContain('bg-primary/10');
  });

  it('applies active style when lessons view is active', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="lessons"
        isExpanded={true}
      />
    );
    const button = screen.getByText('Lessons').closest('button');
    expect(button?.className).toContain('bg-primary/10');
  });

  it('applies active style when lesson-detail view is active (treated as lessons)', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="lesson-detail"
        isExpanded={true}
      />
    );
    const button = screen.getByText('Lessons').closest('button');
    expect(button?.className).toContain('bg-primary/10');
  });

  it('applies active style to header when any learn item is active', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="topics"
        isExpanded={false}
      />
    );
    // Header should be styled as active when any child item is active
    const headerButton = screen.getByRole('button', { name: /learn/i });
    expect(headerButton?.className).toContain('text-primary');
  });

  it('applies active style to header for lesson-detail view', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="lesson-detail"
        isExpanded={false}
      />
    );
    const headerButton = screen.getByRole('button', { name: /learn/i });
    expect(headerButton?.className).toContain('text-primary');
  });

  it('does not apply active style when on admin page', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="topics"
        isOnAdminPage={true}
        isExpanded={true}
      />
    );
    const button = screen.getByText('Topics').closest('button');
    expect(button?.className).not.toContain('bg-primary/10');
  });

  it('disables items marked as disabled', () => {
    const group = createLearnGroup({
      items: [
        { id: 'topics', label: 'Topics', icon: BookOpen, disabled: true },
        { id: 'lessons', label: 'Lessons', icon: Route },
      ],
    });
    renderWithTooltip(
      <SidebarLearnGroup {...defaultProps} group={group} isExpanded={true} />
    );
    const button = screen.getByText('Topics').closest('button');
    expect(button).toBeDisabled();
  });

  it('renders collapsed view with icon only', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} showExpanded={false} />);
    // Should only show the icon button, not the full label
    expect(screen.queryByText('Learn')).not.toBeInTheDocument();
    // But there should still be a button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows tooltip content in collapsed view', async () => {
    const user = userEvent.setup();
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} showExpanded={false} />);

    const button = screen.getByRole('button');
    await user.hover(button);

    // Tooltip should show Learn and list of items
    // Use getAllByText since tooltip duplicates content for accessibility
    const learnTexts = await screen.findAllByText('Learn');
    expect(learnTexts.length).toBeGreaterThan(0);
    const topicsLessonsTexts = await screen.findAllByText('Topics, Lessons');
    expect(topicsLessonsTexts.length).toBeGreaterThan(0);
  });

  it('calls onToggle when collapsed icon is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} showExpanded={false} onToggle={onToggle} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows ChevronDown when expanded', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} isExpanded={true} />);
    // ChevronDown should be present when expanded
    const chevrons = document.querySelectorAll('svg');
    // Should have the header icon and a chevron
    expect(chevrons.length).toBeGreaterThan(1);
  });

  it('shows ChevronRight when not expanded', () => {
    renderWithTooltip(<SidebarLearnGroup {...defaultProps} isExpanded={false} />);
    // ChevronRight should be present when collapsed
    const chevrons = document.querySelectorAll('svg');
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it('sets aria-expanded correctly on header', () => {
    const { rerender } = renderWithTooltip(
      <SidebarLearnGroup {...defaultProps} isExpanded={true} />
    );

    let headerButton = screen.getByText('Learn').closest('button');
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <TooltipProvider>
        <SidebarLearnGroup {...defaultProps} isExpanded={false} />
      </TooltipProvider>
    );

    headerButton = screen.getByText('Learn').closest('button');
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-current on active items', () => {
    renderWithTooltip(
      <SidebarLearnGroup
        {...defaultProps}
        currentView="topics"
        isExpanded={true}
      />
    );
    const topicsButton = screen.getByText('Topics').closest('button');
    expect(topicsButton).toHaveAttribute('aria-current', 'page');

    const lessonsButton = screen.getByText('Lessons').closest('button');
    expect(lessonsButton).not.toHaveAttribute('aria-current');
  });
});
