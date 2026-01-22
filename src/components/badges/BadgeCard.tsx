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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeDefinition, BadgeTier, TIER_COLORS } from '@/hooks/useBadges';

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

interface BadgeCardProps {
  badge: BadgeDefinition;
  /** Callback when badge is clicked */
  onClick?: () => void;
  /** Show "New" indicator for unseen badges */
  showNewIndicator?: boolean;
  className?: string;
}

/**
 * BadgeCard displays a single badge in a compact format.
 * Click to see full details in a modal.
 */
export function BadgeCard({
  badge,
  onClick,
  showNewIndicator = false,
  className,
}: BadgeCardProps) {
  const Icon = ICON_MAP[badge.iconName] || Award;
  const tierColors = TIER_COLORS[badge.tier];
  const isUnlocked = badge.isUnlocked;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center',
        isUnlocked
          ? cn(tierColors.bg, tierColors.border, 'hover:shadow-md')
          : 'bg-muted/30 border-border/50 opacity-50',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* New badge indicator */}
      {showNewIndicator && isUnlocked && !badge.isSeen && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
        />
      )}

      {/* Lock icon overlay for locked badges */}
      {!isUnlocked && (
        <div className="absolute top-1.5 right-1.5">
          <Lock className="w-3 h-3 text-muted-foreground/50" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'p-2.5 rounded-full',
          isUnlocked ? tierColors.bg : 'bg-muted'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            isUnlocked ? tierColors.text : 'text-muted-foreground/50'
          )}
        />
      </div>

      {/* Name */}
      <span
        className={cn(
          'text-xs font-medium leading-tight line-clamp-2',
          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {badge.name}
      </span>
    </motion.button>
  );
}
