import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { getSafeUrl } from "@/lib/utils";

interface SyncStatusBadgeProps {
  status: string | null | undefined;
  syncAt: string | null | undefined;
  error: string | null | undefined;
  questionId: string;
  forumUrl: string;
  onRetrySync: () => Promise<void>;
}

export function SyncStatusBadge({
  status,
  syncAt,
  error,
  questionId,
  forumUrl,
  onRetrySync,
}: SyncStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isSynced = status === "synced";
  const isError = status === "error";
  const isPending = status === "pending";
  // Show "needs verification" when forum_url exists but status is null
  const isUnknown = !status && forumUrl;

  // Only show badge if there's a sync status or forum_url to display
  if (!status && !forumUrl) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetrySync();
    } finally {
      setIsRetrying(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="secondary"
          className={`text-xs cursor-pointer ${
            isSynced
              ? "bg-success/20 text-success hover:bg-success/30"
              : isError
                ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                : isUnknown
                  ? "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {isSynced && <CheckCircle className="w-3 h-3 mr-1" />}
          {isError && <XCircle className="w-3 h-3 mr-1" />}
          {isPending && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
          {isUnknown && <AlertTriangle className="w-3 h-3 mr-1" />}
          {isSynced ? "Synced" : isError ? "Sync Error" : isUnknown ? "Unverified" : "Pending"}
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Discourse Sync Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Question ID</span>
            <span className="font-mono text-sm">{questionId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Topic URL</span>
            {(() => {
              const safeUrl = getSafeUrl(forumUrl);
              return safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Open in Forum <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">Invalid URL</span>
              );
            })()}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant="secondary"
              className={
                isSynced
                  ? "bg-success/20 text-success"
                  : isError
                    ? "bg-destructive/20 text-destructive"
                    : isUnknown
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-muted text-muted-foreground"
              }
            >
              {isSynced ? "Synced" : isError ? "Error" : isUnknown ? "Unverified" : "Pending"}
            </Badge>
          </div>
          {syncAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Sync</span>
              <span className="text-sm">
                {format(new Date(syncAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>
          )}
          {error && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Error</span>
              <div className="p-2 rounded bg-destructive/10 text-destructive text-sm break-words">
                {error}
              </div>
            </div>
          )}
          <div className="pt-4">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Sync
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
