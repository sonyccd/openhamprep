/**
 * Geocoding Modal Component
 *
 * Shows geocoding progress in a modal that discourages closing during processing.
 * Displays Mapbox usage quota and supports resuming from localStorage.
 */

import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  useClientGeocoding,
  useGeocodeResumableProgress,
  useMapboxUsage,
  clearGeocodeProgress,
  type GeocodeProgress,
} from '@/hooks/useGeocoding';
import { QUOTA_WARNING_THRESHOLD } from '@/lib/mapboxGeocoding';
import type { ExamSession } from '@/hooks/useExamSessions';

interface GeocodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sessions missing coordinates (pre-filtered with pagination) */
  sessions: ExamSession[];
  /** Loading state for sessions data */
  isLoading?: boolean;
  /** All geocodeable sessions for force re-geocode mode */
  allSessions?: ExamSession[];
  /** Loading state for allSessions */
  isLoadingAllSessions?: boolean;
  /** Callback to trigger fetching all sessions when force mode is enabled */
  onRequestAllSessions?: () => void;
  onComplete?: () => void;
}

export function GeocodeModal({
  open,
  onOpenChange,
  sessions,
  isLoading,
  allSessions,
  isLoadingAllSessions,
  onRequestAllSessions,
  onComplete,
}: GeocodeModalProps) {
  const [progress, setProgress] = useState<GeocodeProgress | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [forceAll, setForceAll] = useState(false);

  const geocodeMutation = useClientGeocoding();
  const resumableProgress = useGeocodeResumableProgress();
  const mapboxUsage = useMapboxUsage(geocodeMutation.isPending);

  // Sessions missing coordinates - the parent pre-filters for valid addresses,
  // but we still filter here for missing coords to be safe
  const sessionsNeedingGeocode = sessions.filter(
    (s) => !s.latitude || !s.longitude
  );

  // All sessions with valid addresses (from parent, for force mode)
  // Fall back to filtering the sessions we have if allSessions not yet loaded
  const allGeocodeableSessions = allSessions ?? sessions;

  // Which sessions to process based on mode
  const sessionsToProcess = forceAll ? allGeocodeableSessions : sessionsNeedingGeocode;

  // Request all sessions when force mode is enabled
  useEffect(() => {
    if (forceAll && !allSessions && onRequestAllSessions) {
      onRequestAllSessions();
    }
  }, [forceAll, allSessions, onRequestAllSessions]);

  // Account for already-processed sessions from saved progress (only in non-force mode)
  const alreadyProcessedCount = forceAll ? 0 : (resumableProgress?.processedIds.length || 0);
  const remainingToProcess = forceAll
    ? sessionsToProcess.length
    : sessionsToProcess.filter((s) => !resumableProgress?.processedIds.includes(s.id)).length;

  // Check if this batch would use significant quota
  const wouldExceedQuota = remainingToProcess > mapboxUsage.remaining;
  const wouldUseSignificantQuota =
    remainingToProcess > mapboxUsage.remaining * QUOTA_WARNING_THRESHOLD;

  const handleStart = () => {
    // Show warning if using significant quota
    if (wouldUseSignificantQuota && !showQuotaWarning) {
      setShowQuotaWarning(true);
      return;
    }

    // Clear progress when forcing all
    if (forceAll) {
      clearGeocodeProgress();
    }

    setShowQuotaWarning(false);
    geocodeMutation.mutate(
      { sessions: sessionsToProcess, onProgress: setProgress, forceAll },
      {
        onSettled: () => {
          setProgress(null);
          onComplete?.();
        },
      }
    );
  };

  const handleClearProgress = () => {
    clearGeocodeProgress();
    toast.success('Cleared saved progress');
    // Force re-render by closing and reopening
    onOpenChange(false);
  };

  // Prevent closing during processing
  const handleOpenChange = (newOpen: boolean) => {
    if (geocodeMutation.isPending && !newOpen) {
      toast.warning('Please wait for geocoding to complete');
      return;
    }
    setShowQuotaWarning(false);
    onOpenChange(newOpen);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setShowQuotaWarning(false);
      setForceAll(false);
    }
  }, [open]);

  const progressPercent = progress
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocode Addresses
          </DialogTitle>
          <DialogDescription>
            Convert addresses to coordinates for map display.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {(isLoading || (forceAll && isLoadingAllSessions)) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">
                {forceAll ? 'Loading all sessions...' : 'Loading sessions...'}
              </span>
            </div>
          )}
          {/* Mapbox configuration warning */}
          {!mapboxUsage.isConfigured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not Configured</AlertTitle>
              <AlertDescription>
                Mapbox access token not found. Add{' '}
                <code className="text-xs">VITE_MAPBOX_ACCESS_TOKEN</code> to
                your environment.
              </AlertDescription>
            </Alert>
          )}

          {/* Quota exceeded warning */}
          {mapboxUsage.isConfigured && wouldExceedQuota && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Insufficient Quota</AlertTitle>
              <AlertDescription>
                Need {remainingToProcess.toLocaleString()} requests but only{' '}
                {mapboxUsage.remaining.toLocaleString()} remaining this month.
              </AlertDescription>
            </Alert>
          )}

          {/* Quota warning confirmation */}
          {showQuotaWarning && !wouldExceedQuota && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirm Usage</AlertTitle>
              <AlertDescription>
                This will use {remainingToProcess.toLocaleString()} of your{' '}
                {mapboxUsage.remaining.toLocaleString()} remaining monthly
                requests. Continue?
              </AlertDescription>
            </Alert>
          )}

          {/* Resume prompt if there's saved progress */}
          {resumableProgress &&
            !geocodeMutation.isPending &&
            !showQuotaWarning && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Resume Previous Session?</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Found {alreadyProcessedCount.toLocaleString()} already
                    processed. {remainingToProcess.toLocaleString()} remaining.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearProgress}
                    className="text-xs"
                  >
                    Clear saved progress
                  </Button>
                </AlertDescription>
              </Alert>
            )}

          {/* Sessions summary and force option */}
          {!geocodeMutation.isPending && !showQuotaWarning && !isLoading && !(forceAll && isLoadingAllSessions) && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>
                  {forceAll ? (
                    <>
                      {allGeocodeableSessions.length.toLocaleString()} sessions
                      will be re-geocoded
                    </>
                  ) : (
                    <>
                      {sessionsNeedingGeocode.length.toLocaleString()} sessions
                      need geocoding
                      {resumableProgress && !forceAll && (
                        <span>
                          {' '}
                          ({remainingToProcess.toLocaleString()} remaining)
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* Force all toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="force-all" className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Re-geocode all sessions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Overwrite existing coordinates
                    {allSessions ? ` (${allSessions.length.toLocaleString()} total)` : ''}
                  </p>
                </div>
                <Switch
                  id="force-all"
                  checked={forceAll}
                  onCheckedChange={setForceAll}
                  disabled={isLoadingAllSessions}
                />
              </div>
            </div>
          )}

          {/* Progress display during geocoding */}
          {geocodeMutation.isPending && progress && (
            <div className="space-y-4">
              <Progress value={progressPercent} className="h-2" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">
                  {progress.processed.toLocaleString()} of{' '}
                  {progress.total.toLocaleString()} processed ({progressPercent}
                  %)
                </p>
                {progress.currentAddress && (
                  <p className="text-xs truncate">
                    Current: {progress.currentAddress}
                  </p>
                )}
                <p className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1 mt-2">
                  <AlertTriangle className="h-3 w-3" />
                  Please keep this window open
                </p>
              </div>
            </div>
          )}

          {/* Monthly usage display */}
          {mapboxUsage.isConfigured && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div className="flex justify-between">
                <span>Monthly usage:</span>
                <span>
                  {mapboxUsage.current.toLocaleString()} /{' '}
                  {mapboxUsage.limit.toLocaleString()}
                </span>
              </div>
              <Progress
                value={(mapboxUsage.current / mapboxUsage.limit) * 100}
                className="h-1 mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={geocodeMutation.isPending}
          >
            {geocodeMutation.isPending ? 'Processing...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleStart}
            disabled={
              geocodeMutation.isPending ||
              isLoading ||
              (forceAll && isLoadingAllSessions) ||
              remainingToProcess === 0 ||
              wouldExceedQuota ||
              !mapboxUsage.isConfigured
            }
          >
            {geocodeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Geocoding...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {showQuotaWarning
                  ? 'Confirm'
                  : resumableProgress
                    ? `Resume (${remainingToProcess})`
                    : `Start (${remainingToProcess})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
