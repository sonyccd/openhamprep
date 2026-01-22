import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AwardedBadge, BadgeTier, TIER_COLORS } from '@/hooks/useBadges';

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

interface BadgeUnlockToastProps {
  /** The badge that was just unlocked */
  badge: AwardedBadge;
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Callback when user wants to view all badges */
  onViewBadges?: () => void;
  /** Auto-dismiss after this many milliseconds (0 = no auto-dismiss) */
  autoDismissMs?: number;
}

/**
 * BadgeUnlockToast shows a celebration notification when a badge is earned.
 * Features confetti-like animation and prominent badge display.
 *
 * @example
 * ```tsx
 * const [showToast, setShowToast] = useState(false);
 * const [newBadge, setNewBadge] = useState<AwardedBadge | null>(null);
 *
 * // After earning a badge
 * setNewBadge(badge);
 * setShowToast(true);
 *
 * <BadgeUnlockToast
 *   badge={newBadge}
 *   isVisible={showToast}
 *   onDismiss={() => setShowToast(false)}
 *   autoDismissMs={5000}
 * />
 * ```
 */
export function BadgeUnlockToast({
  badge,
  isVisible,
  onDismiss,
  onViewBadges,
  autoDismissMs = 5000,
}: BadgeUnlockToastProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && autoDismissMs > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [isVisible, autoDismissMs, onDismiss]);

  const Icon = ICON_MAP[badge.iconName] || Award;
  const tierColors = TIER_COLORS[badge.tier];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm"
        >
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-xl" />

          {/* Main content */}
          <div
            className={cn(
              'relative rounded-xl border-2 p-4 shadow-lg',
              tierColors.border
            )}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="absolute top-2 right-2 w-6 h-6 opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Sparkle decorations */}
            <Sparkles />

            {/* Content */}
            <div className="flex flex-col items-center text-center gap-3">
              {/* Badge icon with glow effect */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                className={cn(
                  'relative p-4 rounded-full',
                  tierColors.bg
                )}
              >
                {/* Glow ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: 2 }}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    tierColors.bg
                  )}
                />
                <Icon className={cn('w-8 h-8 relative z-10', tierColors.text)} />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Badge Unlocked!
                </p>
                <h3 className="text-lg font-bold mt-1">{badge.name}</h3>
              </motion.div>

              {/* Tier and points */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    tierColors.bg,
                    tierColors.text
                  )}
                >
                  {TIER_LABELS[badge.tier]}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  +{badge.points} pts
                </span>
              </motion.div>

              {/* View badges button */}
              {onViewBadges && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onDismiss();
                      onViewBadges();
                    }}
                  >
                    View All Badges
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Animated sparkle decorations
 */
function Sparkles() {
  const sparklePositions = [
    { top: '10%', left: '5%', delay: 0 },
    { top: '20%', right: '8%', delay: 0.1 },
    { bottom: '25%', left: '10%', delay: 0.2 },
    { bottom: '15%', right: '5%', delay: 0.15 },
    { top: '5%', left: '50%', delay: 0.25 },
  ];

  return (
    <>
      {sparklePositions.map((pos, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            delay: pos.delay,
            repeat: 1,
            repeatDelay: 0.5,
          }}
          className="absolute w-2 h-2"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            bottom: pos.bottom,
          }}
        >
          <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
        </motion.div>
      ))}
    </>
  );
}

/**
 * Hook to manage badge unlock toast state
 */
export function useBadgeUnlockToast() {
  const toastRef = useRef<{
    badge: AwardedBadge;
    resolve: () => void;
  } | null>(null);

  const showBadgeUnlock = (badge: AwardedBadge): Promise<void> => {
    return new Promise((resolve) => {
      toastRef.current = { badge, resolve };
    });
  };

  return { showBadgeUnlock, toastRef };
}
