import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBadges, BadgeDefinition } from '@/hooks/useBadges';
import { BadgeCard } from './BadgeCard';
import { BadgeDetailModal } from './BadgeDetailModal';

interface BadgesShowcaseProps {
  /** Callback when "View All" is clicked */
  onViewAll?: () => void;
  /** Maximum number of badges to show */
  maxBadges?: number;
  className?: string;
}

/**
 * BadgesShowcase displays a preview of the user's badges on the dashboard.
 * Shows most recent unlocked badges with a link to the full gallery.
 */
export function BadgesShowcase({
  onViewAll,
  maxBadges = 5,
  className,
}: BadgesShowcaseProps) {
  const {
    unlockedBadges,
    lockedBadges,
    unseenCount,
    totalPoints,
    getRecentBadges,
    isLoading,
    error,
  } = useBadges();

  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-20 h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const recentBadges = getRecentBadges(maxBadges);
  const hasNoBadges = unlockedBadges.length === 0;
  const totalBadges = unlockedBadges.length + lockedBadges.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-xl p-4 border bg-card', className)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Badges</h3>
              <p className="text-xs text-muted-foreground">
                {unlockedBadges.length} of {totalBadges} earned
                {totalPoints > 0 && (
                  <span className="ml-1.5 font-mono">· {totalPoints} pts</span>
                )}
              </p>
            </div>
          </div>

          {/* Unseen indicator & View All */}
          <div className="flex items-center gap-2">
            {unseenCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                {unseenCount} new
              </span>
            )}
            {onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Badges display */}
        {hasNoBadges ? (
          <EmptyState onViewAll={onViewAll} />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {recentBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <BadgeCard
                  badge={badge}
                  showNewIndicator={!badge.isSeen}
                  onClick={() => setSelectedBadge(badge)}
                  className="w-20 shrink-0"
                />
              </motion.div>
            ))}

            {/* Show "more" indicator if there are more badges */}
            {unlockedBadges.length > maxBadges && onViewAll && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: maxBadges * 0.05 }}
                onClick={onViewAll}
                className="flex flex-col items-center justify-center gap-1 w-20 shrink-0 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="text-lg font-mono">+{unlockedBadges.length - maxBadges}</span>
                <span className="text-xs">more</span>
              </motion.button>
            )}
          </div>
        )}
      </motion.div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        open={selectedBadge !== null}
        onOpenChange={(open) => !open && setSelectedBadge(null)}
      />
    </>
  );
}

/**
 * Empty state shown when user has no badges yet
 */
function EmptyState({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="p-3 rounded-full bg-muted">
        <Award className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">No badges yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start studying to earn your first badge!
        </p>
      </div>
      {onViewAll && (
        <Button variant="secondary" size="sm" onClick={onViewAll}>
          View All Badges
        </Button>
      )}
    </div>
  );
}
