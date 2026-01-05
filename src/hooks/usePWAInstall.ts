import { useState, useEffect, useCallback } from 'react';

const PWA_DISMISSED_KEY = 'pwa_install_dismissed';
const PWA_OUTCOME_KEY = 'pwa_install_outcome';
const ENGAGEMENT_DELAY_MS = 30000; // 30 seconds

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showPrompt: boolean;
  triggerInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(PWA_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveDismissal(): void {
  try {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    localStorage.setItem(PWA_OUTCOME_KEY, 'dismissed');
  } catch {
    // localStorage not available
  }
}

function saveAccepted(): void {
  try {
    localStorage.setItem(PWA_OUTCOME_KEY, 'accepted');
  } catch {
    // localStorage not available
  }
}

function detectIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || '';
  // MSStream check is for IE11 detection on Windows Phone
  const windowWithMSStream = window as Window & { MSStream?: unknown };
  return /iPad|iPhone|iPod/.test(userAgent) && !windowWithMSStream.MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // Safari on iOS has a standalone property on navigator
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasEngaged, setHasEngaged] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS] = useState(detectIOS);

  // Check if already installed (standalone mode)
  useEffect(() => {
    setIsInstalled(isStandalone());

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Check if user permanently dismissed
  useEffect(() => {
    setDismissed(isDismissed());
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent Chrome's mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for successful installation
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      saveAccepted();
    };

    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // Engagement timer - wait before showing prompt
  useEffect(() => {
    const timer = setTimeout(() => setHasEngaged(true), ENGAGEMENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        saveAccepted();
      } else {
        saveDismissal();
        setDismissed(true);
      }
    } catch (error) {
      console.warn('PWA install prompt failed:', error);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    saveDismissal();
    setDismissed(true);
    setDeferredPrompt(null);
  }, []);

  // Determine if we can show the install option
  const canInstall = (!!deferredPrompt || isIOS) && !isInstalled && !dismissed;

  // Only show after engagement delay
  const showPrompt = canInstall && hasEngaged;

  return {
    canInstall,
    isInstalled,
    isIOS,
    showPrompt,
    triggerInstall,
    dismissPrompt,
  };
}
