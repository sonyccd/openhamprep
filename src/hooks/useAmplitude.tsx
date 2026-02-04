import { useEffect, useRef } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { useAuth } from './useAuth';

// Use environment variable - gracefully disabled if not set
const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY || '';

/**
 * AmplitudeProvider syncs the current user's identity with Amplitude.
 * SDK initialization happens in main.tsx; this provider only handles user identity.
 */
export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if Amplitude is not configured
    if (!AMPLITUDE_API_KEY) {
      return;
    }

    try {
      if (user?.id) {
        // Only set user ID if it changed (avoids redundant calls)
        if (identifiedUserRef.current !== user.id) {
          amplitude.setUserId(user.id);
          identifiedUserRef.current = user.id;
        }
      } else if (!user && identifiedUserRef.current) {
        // Reset when user logs out - clears user ID and generates new device ID
        amplitude.reset();
        identifiedUserRef.current = null;
      }
    } catch (error) {
      console.warn('Failed to set Amplitude user identity:', error);
    }
  }, [user]);

  return <>{children}</>;
}
