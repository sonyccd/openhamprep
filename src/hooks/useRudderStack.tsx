import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * RudderStackProvider syncs the current user's identity with RudderStack.
 * SDK initialization happens in main.tsx; this provider only handles user identity.
 */
export function RudderStackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const identifiedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const rs = (window as any).rudderanalytics;
    if (!rs) return;

    try {
      if (user?.id) {
        if (identifiedUserRef.current !== user.id) {
          const traits: Record<string, string> = {};
          if (user.email) traits.email = user.email;
          rs.identify(user.id, traits);
          identifiedUserRef.current = user.id;
        }
      } else if (!user && identifiedUserRef.current) {
        rs.reset();
        identifiedUserRef.current = null;
      }
    } catch (error) {
      console.warn('Failed to set RudderStack user identity:', error);
    }
  }, [user]);

  return <>{children}</>;
}
