import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.openhamprep\.com/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Only enable in production
  enabled: import.meta.env.PROD,
});

// Initialize Amplitude Analytics with Session Replay
// Uses environment variable - gracefully disabled if not set
const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
if (amplitudeApiKey) {
  amplitude.add(sessionReplayPlugin({ sampleRate: 1 }));
  amplitude.init(amplitudeApiKey, { autocapture: true });
}

// Initialize Vercel Analytics only in production (they require Vercel's infrastructure)
if (import.meta.env.PROD) {
  injectSpeedInsights();
  inject();
}

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates periodically (every hour)
        // Store interval ID for potential cleanup (though main.tsx runs once per page load)
        const updateIntervalId = setInterval(() => registration.update(), 60 * 60 * 1000);

        // Clear interval if service worker becomes redundant
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - show non-blocking toast notification
                toast('Update Available', {
                  description: 'A new version of Ham Prep is ready.',
                  action: {
                    label: 'Update Now',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    },
                  },
                  duration: Infinity, // Don't auto-dismiss - let user decide
                });
              } else if (newWorker.state === 'redundant') {
                // Service worker installation failed, clear the interval
                clearInterval(updateIntervalId);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
