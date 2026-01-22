import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BadgeCard } from './BadgeCard';
import type { BadgeDefinition } from '@/hooks/useBadges';

const mockUnlockedBadge: BadgeDefinition = {
  id: '1',
  slug: 'streak-7',
  name: 'Week Warrior',
  description: 'Achieve a 7-day study streak',
  category: 'activity',
  iconName: 'flame',
  tier: 'silver',
  points: 25,
  displayOrder: 4,
  unlockedAt: '2024-01-15T10:30:00Z',
  isSeen: true,
  isUnlocked: true,
};

const mockLockedBadge: BadgeDefinition = {
  id: '2',
  slug: 'streak-14',
  name: 'Two-Week Champion',
  description: 'Achieve a 14-day study streak',
  category: 'activity',
  iconName: 'flame',
  tier: 'gold',
  points: 50,
  displayOrder: 5,
  unlockedAt: null,
  isSeen: false,
  isUnlocked: false,
};

const mockUnseenBadge: BadgeDefinition = {
  ...mockUnlockedBadge,
  id: '3',
  slug: 'first-question',
  name: 'First Steps',
  isSeen: false,
};

describe('BadgeCard', () => {
  describe('default variant', () => {
    it('renders unlocked badge with name and description', () => {
      render(<BadgeCard badge={mockUnlockedBadge} />);

      expect(screen.getByText('Week Warrior')).toBeInTheDocument();
      expect(screen.getByText('Achieve a 7-day study streak')).toBeInTheDocument();
    });

    it('renders tier and points', () => {
      render(<BadgeCard badge={mockUnlockedBadge} />);

      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('25 pts')).toBeInTheDocument();
    });

    it('renders unlock date for unlocked badges', () => {
      render(<BadgeCard badge={mockUnlockedBadge} />);

      expect(screen.getByText(/earned/i)).toBeInTheDocument();
    });

    it('shows lock icon for locked badges', () => {
      render(<BadgeCard badge={mockLockedBadge} />);

      // Locked badge should have reduced opacity
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-60');
    });

    it('does not show unlock date for locked badges', () => {
      render(<BadgeCard badge={mockLockedBadge} />);

      expect(screen.queryByText(/earned/i)).not.toBeInTheDocument();
    });

    it('shows NEW indicator for unseen unlocked badges', () => {
      render(<BadgeCard badge={mockUnseenBadge} showNewIndicator={true} />);

      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('does not show NEW indicator when showNewIndicator is false', () => {
      render(<BadgeCard badge={mockUnseenBadge} showNewIndicator={false} />);

      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('does not show NEW indicator for seen badges', () => {
      render(<BadgeCard badge={mockUnlockedBadge} showNewIndicator={true} />);

      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<BadgeCard badge={mockUnlockedBadge} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('compact variant', () => {
    it('renders badge name', () => {
      render(<BadgeCard badge={mockUnlockedBadge} variant="compact" />);

      expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    });

    it('does not show description in compact mode', () => {
      render(<BadgeCard badge={mockUnlockedBadge} variant="compact" />);

      expect(screen.queryByText('Achieve a 7-day study streak')).not.toBeInTheDocument();
    });

    it('shows dot indicator for unseen badges in compact mode', () => {
      const { container } = render(
        <BadgeCard badge={mockUnseenBadge} variant="compact" showNewIndicator={true} />
      );

      // Should have a small dot indicator, not the full "NEW" text
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
      expect(container.querySelector('.w-2.h-2')).toBeInTheDocument();
    });
  });

  describe('tier colors', () => {
    it('applies bronze colors for bronze tier', () => {
      const bronzeBadge: BadgeDefinition = {
        ...mockUnlockedBadge,
        tier: 'bronze',
      };

      render(<BadgeCard badge={bronzeBadge} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-amber-300');
    });

    it('applies gold colors for gold tier', () => {
      const goldBadge: BadgeDefinition = {
        ...mockUnlockedBadge,
        tier: 'gold',
      };

      render(<BadgeCard badge={goldBadge} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-yellow-400');
    });

    it('applies platinum colors for platinum tier', () => {
      const platinumBadge: BadgeDefinition = {
        ...mockUnlockedBadge,
        tier: 'platinum',
      };

      render(<BadgeCard badge={platinumBadge} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-purple-400');
    });
  });
});
