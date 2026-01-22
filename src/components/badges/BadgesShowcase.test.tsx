import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BadgesShowcase } from './BadgesShowcase';
import type { BadgeDefinition } from '@/hooks/useBadges';

// Mock useBadges hook
const mockUseBadges = vi.fn();
vi.mock('@/hooks/useBadges', () => ({
  useBadges: () => mockUseBadges(),
  TIER_COLORS: {
    bronze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    silver: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
    gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
    platinum: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  },
}));

const mockBadges: BadgeDefinition[] = [
  {
    id: '1',
    slug: 'first-question',
    name: 'First Steps',
    description: 'Answer your first question',
    category: 'activity',
    iconName: 'play',
    tier: 'bronze',
    points: 5,
    displayOrder: 1,
    unlockedAt: '2024-01-10T10:00:00Z',
    isSeen: true,
    isUnlocked: true,
  },
  {
    id: '2',
    slug: 'streak-3',
    name: 'Getting Started',
    description: 'Achieve a 3-day study streak',
    category: 'activity',
    iconName: 'flame',
    tier: 'bronze',
    points: 15,
    displayOrder: 3,
    unlockedAt: '2024-01-12T10:00:00Z',
    isSeen: false,
    isUnlocked: true,
  },
  {
    id: '3',
    slug: 'streak-7',
    name: 'Week Warrior',
    description: 'Achieve a 7-day study streak',
    category: 'activity',
    iconName: 'flame',
    tier: 'silver',
    points: 25,
    displayOrder: 4,
    unlockedAt: null,
    isSeen: false,
    isUnlocked: false,
  },
];

describe('BadgesShowcase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseBadges.mockReturnValue({
      unlockedBadges: [],
      lockedBadges: [],
      unseenCount: 0,
      totalPoints: 0,
      getRecentBadges: () => [],
      isLoading: true,
      error: null,
    });

    render(<BadgesShowcase />);

    // Should show skeleton loading state
    expect(screen.queryByText('Badges')).not.toBeInTheDocument();
  });

  it('renders nothing on error', () => {
    mockUseBadges.mockReturnValue({
      unlockedBadges: [],
      lockedBadges: [],
      unseenCount: 0,
      totalPoints: 0,
      getRecentBadges: () => [],
      isLoading: false,
      error: new Error('Test error'),
    });

    const { container } = render(<BadgesShowcase />);
    expect(container.firstChild).toBeNull();
  });

  it('shows empty state when no badges earned', () => {
    mockUseBadges.mockReturnValue({
      unlockedBadges: [],
      lockedBadges: [mockBadges[2]],
      unseenCount: 0,
      totalPoints: 0,
      getRecentBadges: () => [],
      isLoading: false,
      error: null,
    });

    render(<BadgesShowcase />);

    expect(screen.getByText('No badges yet')).toBeInTheDocument();
    expect(screen.getByText('Start studying to earn your first badge!')).toBeInTheDocument();
  });

  it('displays earned badges count and total', () => {
    const unlockedBadges = mockBadges.filter((b) => b.isUnlocked);
    mockUseBadges.mockReturnValue({
      unlockedBadges,
      lockedBadges: mockBadges.filter((b) => !b.isUnlocked),
      unseenCount: 1,
      totalPoints: 20,
      getRecentBadges: () => unlockedBadges,
      isLoading: false,
      error: null,
    });

    render(<BadgesShowcase />);

    expect(screen.getByText(/2 of 3 earned/i)).toBeInTheDocument();
    expect(screen.getByText(/20 pts/i)).toBeInTheDocument();
  });

  it('shows unseen count badge', () => {
    const unlockedBadges = mockBadges.filter((b) => b.isUnlocked);
    mockUseBadges.mockReturnValue({
      unlockedBadges,
      lockedBadges: mockBadges.filter((b) => !b.isUnlocked),
      unseenCount: 2,
      totalPoints: 20,
      getRecentBadges: () => unlockedBadges,
      isLoading: false,
      error: null,
    });

    render(<BadgesShowcase />);

    expect(screen.getByText('2 new')).toBeInTheDocument();
  });

  it('calls onViewAll when View All is clicked', async () => {
    const user = userEvent.setup();
    const handleViewAll = vi.fn();
    const unlockedBadges = mockBadges.filter((b) => b.isUnlocked);

    mockUseBadges.mockReturnValue({
      unlockedBadges,
      lockedBadges: mockBadges.filter((b) => !b.isUnlocked),
      unseenCount: 0,
      totalPoints: 20,
      getRecentBadges: () => unlockedBadges,
      isLoading: false,
      error: null,
    });

    render(<BadgesShowcase onViewAll={handleViewAll} />);

    await user.click(screen.getByRole('button', { name: /view all/i }));
    expect(handleViewAll).toHaveBeenCalledTimes(1);
  });

  it('renders recent badges', () => {
    const unlockedBadges = mockBadges.filter((b) => b.isUnlocked);

    mockUseBadges.mockReturnValue({
      unlockedBadges,
      lockedBadges: mockBadges.filter((b) => !b.isUnlocked),
      unseenCount: 0,
      totalPoints: 20,
      getRecentBadges: () => unlockedBadges,
      isLoading: false,
      error: null,
    });

    render(<BadgesShowcase />);

    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('respects maxBadges prop', () => {
    const manyBadges = Array.from({ length: 10 }, (_, i) => ({
      ...mockBadges[0],
      id: String(i),
      slug: `badge-${i}`,
      name: `Badge ${i}`,
      unlockedAt: new Date(2024, 0, i + 1).toISOString(),
    }));

    mockUseBadges.mockReturnValue({
      unlockedBadges: manyBadges,
      lockedBadges: [],
      unseenCount: 0,
      totalPoints: 50,
      getRecentBadges: (limit: number) => manyBadges.slice(0, limit),
      isLoading: false,
      error: null,
    });

    // onViewAll is required for the "more" indicator to show
    render(<BadgesShowcase maxBadges={3} onViewAll={() => {}} />);

    // Should show +7 more indicator
    expect(screen.getByText('+7')).toBeInTheDocument();
    expect(screen.getByText('more')).toBeInTheDocument();
  });
});
