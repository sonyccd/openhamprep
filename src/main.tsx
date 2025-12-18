import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

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
