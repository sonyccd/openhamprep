import { useEffect, useRef, createElement } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Users } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const COMMUNITY_URL = 'https://forum.openhamprep.com/auth/oidc';
const STORAGE_KEY = 'community-toast-shown';
const TEST_MODE_KEY = 'community-toast-test-mode';
const DAYS_AFTER_SIGNUP = 3;

interface UseCommunityPromoToastOptions {
  userCreatedAt: string | null | undefined;
  forumUsername: string | null | undefined;
  isAuthenticated: boolean;
}

export function useCommunityPromoToast({
  userCreatedAt,
  forumUsername,
  isAuthenticated,
}: UseCommunityPromoToastOptions) {
  // Check if PWA install banner is showing to avoid overlap
  const { showPrompt: isPWABannerShowing } = usePWAInstall();

  // Use ref to prevent multiple toast triggers during re-renders
  const hasScheduledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Guard: Must be authenticated
    if (!isAuthenticated || !userCreatedAt) {
      return;
    }

    // Guard: User has already authenticated with Discourse
    if (forumUsername) {
      return;
    }

    // Guard: Toast already shown (check localStorage)
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      return;
    }

    // Guard: Don't show while PWA install banner is visible
    if (isPWABannerShowing) {
      return;
    }

    // Guard: Already scheduled (prevents re-scheduling on re-renders)
    if (hasScheduledRef.current) {
      return;
    }

    // Check if 3 days have passed since signup (skip in test mode)
    const isTestMode = localStorage.getItem(TEST_MODE_KEY) === 'true';

    if (!isTestMode) {
      const signupDate = new Date(userCreatedAt);
      const now = new Date();
      const daysSinceSignup = Math.floor(
        (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceSignup < DAYS_AFTER_SIGNUP) {
        return;
      }
    }

    // Mark as scheduled (don't clear this on re-render)
    hasScheduledRef.current = true;

    // Clear any existing timeout before scheduling a new one (prevents memory leak)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Small delay to ensure the page is fully loaded
    timeoutRef.current = setTimeout(() => {
      toast({
        title: createElement('div', {
          className: 'flex items-center gap-3',
          role: 'status',
          'aria-live': 'polite',
        },
          createElement('div', { className: 'p-2 rounded-lg bg-primary/10 shrink-0' },
            createElement(Users, { className: 'w-5 h-5 text-primary', 'aria-hidden': true })
          ),
          createElement('span', { className: 'font-semibold text-foreground' }, 'Join the Community!')
        ),
        description: 'Connect with fellow ham radio enthusiasts, ask questions, and share your progress.',
        duration: Infinity, // Stay open until manually dismissed
        action: createElement(ToastAction, {
          altText: 'Visit the Open Ham Prep community forum',
          className: 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-2 h-auto rounded-lg',
          onClick: () => {
            const newWindow = window.open(COMMUNITY_URL, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
              // Popup was blocked - still mark as shown since user attempted to visit
              // The toast will close via onOpenChange which also sets localStorage
              console.warn('Popup blocked. Please allow popups to visit the community forum.');
            }
            // Note: localStorage is set via onOpenChange when toast closes, avoiding duplicate writes
          },
        },
          createElement('span', { className: 'flex items-center gap-2' },
            createElement(Users, { className: 'w-4 h-4', 'aria-hidden': true }),
            'Visit Community'
          )
        ),
        // Only mark as shown when user dismisses the toast (clicks X or action button)
        onOpenChange: (open: boolean) => {
          if (!open) {
            localStorage.setItem(STORAGE_KEY, 'true');
          }
        },
      });
    }, 1500);
  // Note: Only props are in deps array. isTestMode is read from localStorage inside
  // the effect and doesn't need to trigger re-runs (it's checked fresh each time).
  }, [userCreatedAt, forumUsername, isAuthenticated, isPWABannerShowing]);

  // Cleanup on unmount - reset refs so remounting can re-schedule if needed
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Reset scheduled flag so remounting allows toast to show again
      // (if localStorage wasn't set, the toast should still be shown)
      hasScheduledRef.current = false;
    };
  }, []);
}
