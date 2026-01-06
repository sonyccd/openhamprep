import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

// Use environment variable - gracefully disabled if not set
const PENDO_API_KEY = import.meta.env.VITE_PENDO_API_KEY || '';

// Extend Window interface to include pendo
declare global {
  interface Window {
    pendo?: {
      initialize: (config: {
        visitor: {
          id: string;
          email?: string;
        };
        account?: {
          id: string;
        };
      }) => void;
      isReady: () => boolean;
      track: (name: string, metadata?: Record<string, unknown>) => void;
    };
  }
}

// Track if Pendo script has been loaded (persists across component remounts)
let pendoScriptLoaded = false;
let loadingPromise: Promise<void> | null = null;

function loadPendoScript(apiKey: string): Promise<void> {
  // Return existing promise if already loading (prevents race conditions)
  if (loadingPromise) {
    return loadingPromise;
  }

  if (pendoScriptLoaded) {
    return Promise.resolve();
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Use the official Pendo snippet approach
    (function(p: Window, e: Document, n: string, d: string, o?: { _q?: unknown[] }) {
      o = p[d as keyof Window] = p[d as keyof Window] || {};
      (o as { _q: unknown[] })._q = (o as { _q: unknown[] })._q || [];
      const v = ['initialize', 'identify', 'updateOptions', 'pageLoad'];
      for (let w = 0, x = v.length; w < x; ++w) {
        (function(m) {
          (o as Record<string, unknown>)[m] = (o as Record<string, unknown>)[m] || function(...args: unknown[]) {
            ((o as { _q: unknown[] })._q)[m === v[0] ? 'unshift' : 'push']([m].concat(args));
          };
        })(v[w]);
      }
      const y = e.createElement(n) as HTMLScriptElement;
      y.async = true;
      y.src = 'https://cdn.pendo.io/agent/static/' + apiKey + '/pendo.js';
      y.onload = () => {
        pendoScriptLoaded = true;
        loadingPromise = null;
        resolve();
      };
      y.onerror = (error) => {
        loadingPromise = null;
        reject(error);
      };
      const z = e.getElementsByTagName(n)[0];
      z.parentNode?.insertBefore(y, z);
    })(window, document, 'script', 'pendo');
  });

  return loadingPromise;
}

/**
 * PendoProvider initializes Pendo with the current user's identity.
 * Pendo's agent auto-captures all user interactions - no manual tracking needed.
 */
export function PendoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Skip if Pendo key is not configured
    if (!PENDO_API_KEY) {
      return;
    }

    let isMounted = true;

    // Only initialize when user is authenticated
    if (user?.email) {
      loadPendoScript(PENDO_API_KEY)
        .then(() => {
          // Don't initialize if component unmounted during script load
          if (!isMounted) return;

          if (!isInitializedRef.current && window.pendo) {
            window.pendo.initialize({
              visitor: {
                id: user.id,
                email: user.email,
              },
            });
            isInitializedRef.current = true;
          }
        })
        .catch((error) => {
          if (!isMounted) return;
          console.warn('Failed to load Pendo:', error);
        });
    } else if (!user && isInitializedRef.current) {
      // Reset when user logs out
      isInitializedRef.current = false;
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  return <>{children}</>;
}
