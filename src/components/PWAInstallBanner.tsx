import { useEffect, useCallback, useRef } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Download, X, Share, Plus } from 'lucide-react';

export function PWAInstallBanner() {
  const { showPrompt, isIOS, triggerInstall, dismissPrompt } = usePWAInstall();
  const bannerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle Escape key to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrompt) {
        dismissPrompt();
      }
    },
    [showPrompt, dismissPrompt]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management: move focus to banner when it appears, restore when dismissed
  useEffect(() => {
    if (showPrompt && bannerRef.current && !isIOS) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Small delay to ensure animation has started
      const timer = setTimeout(() => {
        bannerRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPrompt, isIOS]);

  // Restore focus when banner is dismissed
  useEffect(() => {
    return () => {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  if (!showPrompt) return null;

  // iOS needs manual instructions via dialog
  if (isIOS) {
    return <IOSInstallDialog onDismiss={dismissPrompt} />;
  }

  // Standard install banner for Chrome, Edge, etc.
  return (
    <div
      ref={bannerRef}
      tabIndex={-1}
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40
                 bg-card border border-border rounded-lg shadow-lg p-4
                 animate-in slide-in-from-bottom-4 fade-in duration-300
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      role="alertdialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      aria-modal="false"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            id="pwa-install-title"
            className="font-medium text-foreground text-sm"
          >
            Install Open Ham Prep
          </h3>
          <p
            id="pwa-install-description"
            className="text-sm text-muted-foreground mt-0.5"
          >
            Quick access from your home screen
          </p>
        </div>
        <button
          onClick={dismissPrompt}
          className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <Button variant="ghost" size="sm" onClick={dismissPrompt}>
          Not now
        </Button>
        <Button size="sm" onClick={triggerInstall}>
          Install
        </Button>
      </div>
    </div>
  );
}

interface IOSInstallDialogProps {
  onDismiss: () => void;
}

function IOSInstallDialog({ onDismiss }: IOSInstallDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" aria-hidden="true" />
            Install Open Ham Prep
          </DialogTitle>
          <DialogDescription>
            Add this app to your home screen for quick access
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 py-4 list-none" aria-label="Installation steps">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium" aria-hidden="true">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Tap the{' '}
                <span className="inline-flex items-center gap-1 font-medium">
                  Share
                  <Share className="w-4 h-4" aria-hidden="true" />
                </span>{' '}
                button in Safari
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium" aria-hidden="true">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Scroll down and tap{' '}
                <span className="inline-flex items-center gap-1 font-medium">
                  Add to Home Screen
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </span>
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium" aria-hidden="true">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Tap <span className="font-medium">Add</span> to confirm
              </p>
            </div>
          </li>
        </ol>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
