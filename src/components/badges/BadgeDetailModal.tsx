import { motion } from 'framer-motion';
import {
  Flame,
  Play,
  FileCheck,
  Award,
  Star,
  TrendingUp,
  Radio,
  Crown,
  Target,
  Compass,
  BookOpen,
  Hash,
  Lock,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BadgeDefinition, BadgeTier, TIER_COLORS, CATEGORY_LABELS } from '@/hooks/useBadges';

/**
 * Map of icon names to Lucide components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  play: Play,
  'file-check': FileCheck,
  award: Award,
  star: Star,
  'trending-up': TrendingUp,
  radio: Radio,
  crown: Crown,
  target: Target,
  compass: Compass,
  'book-open': BookOpen,
  hash: Hash,
};

/**
 * Tier labels for display
 */
const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

interface BadgeDetailModalProps {
  badge: BadgeDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal showing full details for a badge
 */
export function BadgeDetailModal({ badge, open, onOpenChange }: BadgeDetailModalProps) {
  if (!badge) return null;

  const Icon = ICON_MAP[badge.iconName] || Award;
  const tierColors = TIER_COLORS[badge.tier];
  const isUnlocked = badge.isUnlocked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{badge.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center gap-4 py-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={cn(
              'relative p-5 rounded-full',
              isUnlocked ? tierColors.bg : 'bg-muted'
            )}
          >
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
            <Icon
              className={cn(
                'w-10 h-10',
                isUnlocked ? tierColors.text : 'text-muted-foreground/30'
              )}
            />
          </motion.div>

          {/* Name */}
          <div>
            <h2 className="text-xl font-bold">{badge.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {CATEGORY_LABELS[badge.category]}
            </p>
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{badge.description}</p>

          {/* Tier and points */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                isUnlocked ? cn(tierColors.bg, tierColors.text) : 'bg-muted text-muted-foreground'
              )}
            >
              {TIER_LABELS[badge.tier]}
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {badge.points} points
            </span>
          </div>

          {/* Status */}
          {isUnlocked ? (
            <div className="pt-2 border-t w-full">
              <p className="text-sm text-success font-medium">
                Earned on {new Date(badge.unlockedAt!).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t w-full">
              <p className="text-sm text-muted-foreground">
                Keep practicing to unlock this badge!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
