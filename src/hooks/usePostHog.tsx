import { createContext, useContext, useEffect, ReactNode } from 'react';
import posthog from 'posthog-js';
import { useAuth } from './useAuth';

const POSTHOG_KEY = 'phc_7CxjA0EIeU4J1oVDzRo1dVpgiTJ15qac0mYhid2Zvm4';
const POSTHOG_HOST = 'https://us.i.posthog.com';

interface PostHogContextType {
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

const PostHogContext = createContext<PostHogContextType | undefined>(undefined);

let isInitialized = false;

export function PostHogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize and track when user is authenticated
    if (user?.email) {
      if (!isInitialized) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
        });
        isInitialized = true;
      }

      // Identify user by email
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.display_name || user.email,
      });
    } else if (isInitialized) {
      // Reset when user logs out
      posthog.reset();
    }
  }, [user]);

  const capture = (event: string, properties?: Record<string, unknown>) => {
    if (user && isInitialized) {
      posthog.capture(event, properties);
    }
  };

  return (
    <PostHogContext.Provider value={{ capture }}>
      {children}
    </PostHogContext.Provider>
  );
}

export function usePostHog() {
  const context = useContext(PostHogContext);
  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
}
