import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Badge tiers in order of prestige
 */
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Badge categories for organization
 */
export type BadgeCategory = 'activity' | 'achievement' | 'mastery' | 'engagement' | 'milestone';

/**
 * Badge definition from the database
 */
export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
  tier: BadgeTier;
  points: number;
  displayOrder: number;
  unlockedAt: string | null;
  isSeen: boolean;
  isUnlocked: boolean;
}

/**
 * Badge awarded during a check operation
 */
export interface AwardedBadge {
  id: string;
  slug: string;
  name: string;
  tier: BadgeTier;
  points: number;
  iconName: string;
}

/** Raw response from the get_user_badges RPC */
interface RawBadge {
  badge_id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon_name: string;
  tier: string;
  points: number;
  display_order: number;
  unlocked_at: string | null;
  is_seen: boolean;
  is_unlocked: boolean;
}

/** Raw response from check_badges_for_user RPC */
interface RawAwardedBadge {
  badge_id: string;
  badge_slug: string;
  badge_name: string;
  badge_tier: string;
  badge_points: number;
  badge_icon: string;
}

/**
 * Transform raw database badge to frontend format
 */
function transformBadge(raw: RawBadge): BadgeDefinition {
  return {
    id: raw.badge_id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    category: raw.category as BadgeCategory,
    iconName: raw.icon_name,
    tier: raw.tier as BadgeTier,
    points: raw.points,
    displayOrder: raw.display_order,
    unlockedAt: raw.unlocked_at,
    isSeen: raw.is_seen,
    isUnlocked: raw.is_unlocked,
  };
}

/**
 * Transform raw awarded badge to frontend format
 */
function transformAwardedBadge(raw: RawAwardedBadge): AwardedBadge {
  return {
    id: raw.badge_id,
    slug: raw.badge_slug,
    name: raw.badge_name,
    tier: raw.badge_tier as BadgeTier,
    points: raw.badge_points,
    iconName: raw.badge_icon,
  };
}

/**
 * Hook to fetch and manage user badges.
 * Uses the get_user_badges RPC for efficient single-query data retrieval.
 *
 * @returns Object containing badge data, loading state, and actions
 *
 * @example
 * ```tsx
 * const { unlockedBadges, lockedBadges, unseenCount, totalPoints, checkBadges } = useBadges();
 *
 * // Show badge notification
 * if (unseenCount > 0) {
 *   console.log(`You have ${unseenCount} new badges!`);
 * }
 *
 * // After user activity, check for new badges
 * const newBadges = await checkBadges();
 * if (newBadges.length > 0) {
 *   showBadgeToast(newBadges[0]);
 * }
 * ```
 */
export function useBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async (): Promise<BadgeDefinition[]> => {
      const { data, error } = await supabase.rpc('get_user_badges', {
        p_user_id: user!.id,
      });

      if (error) {
        console.error('Error fetching badges:', error);
        throw error;
      }

      return (data as RawBadge[]).map(transformBadge);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const allBadges = data ?? [];
  const unlockedBadges = allBadges.filter((b) => b.isUnlocked);
  const lockedBadges = allBadges.filter((b) => !b.isUnlocked);
  const unseenBadges = unlockedBadges.filter((b) => !b.isSeen);
  const totalPoints = unlockedBadges.reduce((sum, b) => sum + b.points, 0);

  /**
   * Invalidate badge queries to force a refresh.
   * Call this after checking for new badges.
   */
  const invalidateBadges = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['badges', user.id] });
    }
  };

  /**
   * Check for and award any newly earned badges.
   * Returns the list of newly awarded badges (if any).
   */
  const checkBadges = async (): Promise<AwardedBadge[]> => {
    if (!user) return [];

    const { data, error } = await supabase.rpc('check_badges_for_user', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error checking badges:', error);
      return [];
    }

    const newBadges = (data as RawAwardedBadge[] | null)?.map(transformAwardedBadge) ?? [];

    // Invalidate cache if new badges were awarded
    if (newBadges.length > 0) {
      invalidateBadges();
    }

    return newBadges;
  };

  /**
   * Mark badges as seen (viewed by user).
   * Call this when displaying badge unlock notifications.
   */
  const markBadgesSeen = async (badgeIds: string[]): Promise<void> => {
    if (!user || badgeIds.length === 0) return;

    const { error } = await supabase.rpc('mark_badges_seen', {
      p_user_id: user.id,
      p_badge_ids: badgeIds,
    });

    if (error) {
      console.error('Error marking badges seen:', error);
      return;
    }

    // Update local cache optimistically
    queryClient.setQueryData(['badges', user.id], (old: BadgeDefinition[] | undefined) => {
      if (!old) return old;
      return old.map((badge) =>
        badgeIds.includes(badge.id) ? { ...badge, isSeen: true } : badge
      );
    });
  };

  /**
   * Get badges by category for organized display.
   */
  const getBadgesByCategory = (category: BadgeCategory): BadgeDefinition[] => {
    return allBadges.filter((b) => b.category === category);
  };

  /**
   * Get the most recently unlocked badges (for showcase).
   */
  const getRecentBadges = (limit: number = 5): BadgeDefinition[] => {
    return [...unlockedBadges]
      .sort((a, b) => {
        const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  };

  return {
    /** All badge definitions (unlocked + locked) */
    allBadges,
    /** Badges the user has earned */
    unlockedBadges,
    /** Badges the user hasn't earned yet */
    lockedBadges,
    /** Newly earned badges the user hasn't seen */
    unseenBadges,
    /** Number of unseen badges */
    unseenCount: unseenBadges.length,
    /** Total gamification points earned */
    totalPoints,

    /** Whether the query is currently loading */
    isLoading,
    /** Error object if the query failed */
    error,

    /** Check for and award newly earned badges */
    checkBadges,
    /** Mark badges as seen by the user */
    markBadgesSeen,
    /** Invalidate the badge cache to trigger a refresh */
    invalidateBadges,
    /** Get badges filtered by category */
    getBadgesByCategory,
    /** Get most recently unlocked badges */
    getRecentBadges,
  };
}

/**
 * Tier colors for UI rendering
 */
export const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; border: string }> = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-600',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-400 dark:border-yellow-600',
  },
  platinum: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-400 dark:border-purple-600',
  },
};

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  activity: 'Activity',
  achievement: 'Achievement',
  mastery: 'Mastery',
  engagement: 'Engagement',
  milestone: 'Milestone',
};
