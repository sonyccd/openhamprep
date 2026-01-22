import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Flame, Target, BookOpen, Hash, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBadges, BadgeCategory, BadgeDefinition, CATEGORY_LABELS } from '@/hooks/useBadges';
import { BadgeCard } from './BadgeCard';
import { BadgeDetailModal } from './BadgeDetailModal';

/**
 * Category icons for visual distinction
 */
const CATEGORY_ICONS: Record<BadgeCategory, typeof Award> = {
  activity: Flame,
  achievement: Trophy,
  mastery: Target,
  engagement: BookOpen,
  milestone: Hash,
};

interface BadgesGalleryProps {
  /** Callback to navigate back to dashboard */
  onBack?: () => void;
  className?: string;
}

/**
 * BadgesGallery displays all badges organized by category.
 * Shows both locked and unlocked badges with progress summary.
 *
 * @example
 * ```tsx
 * <BadgesGallery onBack={() => changeView('dashboard')} />
 * ```
 */
export function BadgesGallery({ onBack, className }: BadgesGalleryProps) {
  const {
    allBadges,
    unlockedBadges,
    unseenBadges,
    totalPoints,
    getBadgesByCategory,
    markBadgesSeen,
    isLoading,
    error,
  } = useBadges();

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  // Mark unseen badges as seen when gallery is opened
  useEffect(() => {
    if (unseenBadges.length > 0) {
      const unseenIds = unseenBadges.map((b) => b.id);
      markBadgesSeen(unseenIds);
    }
  }, [unseenBadges, markBadgesSeen]);

  if (error) {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-12', className)}>
        <p className="text-muted-foreground">Failed to load badges</p>
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Go Back
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-6', className)}>
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const categories: (BadgeCategory | 'all')[] = [
    'all',
    'activity',
    'achievement',
    'mastery',
    'engagement',
    'milestone',
  ];

  const filteredBadges =
    selectedCategory === 'all'
      ? allBadges
      : getBadgesByCategory(selectedCategory);

  const unlockedCount = filteredBadges.filter((b) => b.isUnlocked).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Badges</h1>
            <p className="text-muted-foreground text-sm">
              {unlockedBadges.length} of {allBadges.length} earned
              <span className="ml-2 font-mono">· {totalPoints} total points</span>
            </p>
          </div>
        </div>

        {/* Points highlight */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-mono text-lg font-bold text-primary">{totalPoints}</span>
          <span className="text-sm text-muted-foreground">points</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((category) => {
          const isAll = category === 'all';
          const Icon = isAll ? Award : CATEGORY_ICONS[category];
          const count = isAll
            ? allBadges.length
            : getBadgesByCategory(category).length;
          const unlockedInCategory = isAll
            ? unlockedBadges.length
            : getBadgesByCategory(category).filter((b) => b.isUnlocked).length;

          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'gap-1.5 shrink-0',
                selectedCategory === category && 'shadow-sm'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{isAll ? 'All' : CATEGORY_LABELS[category]}</span>
              <span className="text-xs opacity-70">
                ({unlockedInCategory}/{count})
              </span>
            </Button>
          );
        })}
      </div>

      {/* Badge grid */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Showing {unlockedCount} of {filteredBadges.length} badges unlocked
        </p>

        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <BadgeCard
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
                className="h-full"
              />
            </motion.div>
          ))}
        </motion.div>

        {filteredBadges.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No badges in this category yet</p>
          </div>
        )}
      </div>

      {/* Progress overview */}
      <div className="border-t pt-6 mt-6">
        <h2 className="font-semibold mb-4">Category Progress</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(Object.keys(CATEGORY_LABELS) as BadgeCategory[]).map((category) => {
            const badges = getBadgesByCategory(category);
            const unlocked = badges.filter((b) => b.isUnlocked).length;
            const total = badges.length;
            const progress = total > 0 ? (unlocked / total) * 100 : 0;
            const Icon = CATEGORY_ICONS[category];

            return (
              <div
                key={category}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{CATEGORY_LABELS[category]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {unlocked}/{total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        open={selectedBadge !== null}
        onOpenChange={(open) => !open && setSelectedBadge(null)}
      />
    </div>
  );
}
