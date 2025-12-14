import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Global function to reset onboarding - exposed for console access
declare global {
  interface Window {
    resetOnboarding: () => void;
  }
}

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch onboarding status from database
  useEffect(() => {
    async function fetchOnboardingStatus() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching onboarding status:', error);
          // Default to not showing onboarding on error
          setHasCompletedOnboarding(true);
          setShowOnboarding(false);
        } else {
          const isCompleted = data?.onboarding_completed ?? false;
          setHasCompletedOnboarding(isCompleted);
          setShowOnboarding(!isCompleted);
        }
      } catch (err) {
        console.error('Error fetching onboarding status:', err);
        setHasCompletedOnboarding(true);
        setShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOnboardingStatus();
  }, [user]);

  const updateOnboardingStatus = useCallback(async (completed: boolean) => {
    if (!user) {
      console.warn('Cannot update onboarding status: no user logged in');
      return;
    }

    console.log(`Updating onboarding_completed to ${completed} for user ${user.id}`);

    try {
      const { error, data } = await supabase
        .from('profiles')
        .update({ onboarding_completed: completed })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Error updating onboarding status:', error);
      } else {
        console.log('Successfully updated onboarding status:', data);
        // Invalidate profile query to refresh any cached data
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }
    } catch (err) {
      console.error('Error updating onboarding status:', err);
    }
  }, [user, queryClient]);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    await updateOnboardingStatus(true);
  }, [updateOnboardingStatus]);

  const skipOnboarding = useCallback(async () => {
    // Same as completing - user chose to skip, don't show again
    console.log('skipOnboarding called - marking onboarding as completed');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    await updateOnboardingStatus(true);
  }, [updateOnboardingStatus]);

  const resetOnboarding = useCallback(async () => {
    // For testing/debugging - allows re-showing onboarding
    setHasCompletedOnboarding(false);
    setShowOnboarding(true);
    await updateOnboardingStatus(false);
  }, [updateOnboardingStatus]);

  // Register global console command for testing
  useEffect(() => {
    window.resetOnboarding = async () => {
      if (!user) {
        console.log('❌ No user logged in. Please log in first.');
        return;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: false })
          .eq('id', user.id);

        if (error) {
          console.error('Error resetting onboarding:', error);
        } else {
          console.log('🎉 Onboarding reset! Refreshing page...');
          window.location.reload();
        }
      } catch (err) {
        console.error('Error resetting onboarding:', err);
      }
    };

    // Log availability in development
    if (import.meta.env.DEV) {
      console.log('💡 Tip: Run resetOnboarding() in console to restart the onboarding tour');
    }

    return () => {
      delete window.resetOnboarding;
    };
  }, [user]);

  return {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    isLoading,
  };
}
