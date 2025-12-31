import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Wrench,
  Search,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useDiscourseSyncStatus,
  type VerifyResult,
} from "@/hooks/useDiscourseSyncStatus";

export function DiscourseSyncDashboard() {
  const {
    overview,
    totals,
    isLoading,
    isError,
    verify,
    repair,
    refreshOverview,
  } = useDiscourseSyncStatus();

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  const [showRepairDialog, setShowRepairDialog] = useState(false);

  const handleVerify = async () => {
    try {
      const result = await verify.mutateAsync();
      setVerifyResult(result);
      setLastVerified(new Date());
      toast.success("Sync verification complete");
    } catch (error) {
      toast.error(
        "Verification failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleRepair = async () => {
    setShowRepairDialog(false);
    try {
      const result = await repair.mutateAsync();
      setVerifyResult(result);
      setLastVerified(new Date());
      toast.success(`Repaired ${result.repaired || 0} items`);
    } catch (error) {
      toast.error(
        "Repair failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">
          Failed to load sync status. Make sure you have admin access.
        </p>
        <Button variant="outline" onClick={refreshOverview} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const syncPercentage = totals
    ? totals.totalQuestions > 0
      ? (totals.synced / totals.totalQuestions) * 100
      : 0
    : 0;

  const hasDiscrepancies = verifyResult
    ? verifyResult.discrepancies.orphanedInDiscourse.length > 0 ||
      verifyResult.discrepancies.brokenForumUrl.length > 0 ||
      verifyResult.discrepancies.missingStatus.length > 0
    : false;

  return (
    <div className="space-y-6 pb-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals?.totalQuestions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all license types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Forum Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totals?.withForumUrl || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals?.withoutForumUrl || 0} without topics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Synced Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totals?.synced || 0}
            </div>
            <Progress value={syncPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold text-destructive">
                  {totals?.errors || 0}
                </span>
                <span className="text-xs text-muted-foreground ml-1">errors</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-amber-500">
                  {totals?.needsVerification || 0}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  unverified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By License Type */}
      {overview && overview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Sync Status by License Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overview.map((row) => {
                const percentage =
                  row.total_questions > 0
                    ? (row.synced / row.total_questions) * 100
                    : 0;
                return (
                  <div key={row.license_type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.license_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {row.total_questions} questions
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-3 h-3" />
                          {row.synced}
                        </span>
                        {row.errors > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="w-3 h-3" />
                            {row.errors}
                          </span>
                        )}
                        {row.needs_verification > 0 && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            {row.needs_verification}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {row.without_forum_url} no topic
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Sync Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleVerify}
              disabled={verify.isPending}
              variant="outline"
            >
              {verify.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Verify Sync Status
                </>
              )}
            </Button>

            <Button
              onClick={() => setShowRepairDialog(true)}
              disabled={repair.isPending || !verifyResult || !hasDiscrepancies}
              variant="default"
            >
              {repair.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Repair Missing URLs
                </>
              )}
            </Button>

            <Button onClick={refreshOverview} variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {lastVerified && (
            <p className="text-xs text-muted-foreground">
              Last verified: {format(lastVerified, "MMM d, yyyy h:mm a")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verifyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasDiscrepancies ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              Verification Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-xs text-muted-foreground">DB Questions</p>
                <p className="text-lg font-bold">
                  {verifyResult.summary.totalQuestionsInDb}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discourse Topics</p>
                <p className="text-lg font-bold">
                  {verifyResult.summary.totalTopicsInDiscourse}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With Forum URL</p>
                <p className="text-lg font-bold">
                  {verifyResult.summary.questionsWithForumUrl}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Synced Correctly</p>
                <p className="text-lg font-bold text-success">
                  {verifyResult.summary.syncedCorrectly}
                </p>
              </div>
            </div>

            {verifyResult.repaired !== undefined && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="text-success font-medium">
                  Repaired {verifyResult.repaired} items
                </p>
              </div>
            )}

            {/* Orphaned in Discourse */}
            {verifyResult.discrepancies.orphanedInDiscourse.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Topics in Discourse without forum_url (
                  {verifyResult.discrepancies.orphanedInDiscourse.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {verifyResult.discrepancies.orphanedInDiscourse.map((item) => (
                    <div
                      key={item.questionDisplayName}
                      className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {item.questionDisplayName}
                        </span>
                        {item.action && (
                          <Badge
                            variant="secondary"
                            className={
                              item.action === "repaired"
                                ? "bg-success/20 text-success"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {item.action}
                          </Badge>
                        )}
                      </div>
                      <a
                        href={item.topicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Topic <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Broken Forum URLs */}
            {verifyResult.discrepancies.brokenForumUrl.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Broken Forum URLs (
                  {verifyResult.discrepancies.brokenForumUrl.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {verifyResult.discrepancies.brokenForumUrl.map((item) => (
                    <div
                      key={item.questionId}
                      className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {item.questionDisplayName}
                        </span>
                        <span className="text-xs text-destructive">
                          {item.error}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.forumUrl}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Sync Status */}
            {verifyResult.discrepancies.missingStatus.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Missing Sync Status (
                  {verifyResult.discrepancies.missingStatus.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {verifyResult.discrepancies.missingStatus.map((item) => (
                    <div
                      key={item.questionId}
                      className="p-3 rounded-lg border border-border bg-secondary/30 flex items-center justify-between"
                    >
                      <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.questionDisplayName}
                      </span>
                      <a
                        href={item.forumUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View Topic <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasDiscrepancies && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">
                  All synced questions are in good shape!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Repair Confirmation Dialog */}
      <AlertDialog open={showRepairDialog} onOpenChange={setShowRepairDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Repair Discourse Sync?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the database to fix missing forum URLs by matching
              existing Discourse topics to questions. It will also mark questions
              with existing forum URLs as synced.
              <br />
              <br />
              {verifyResult && (
                <>
                  <strong>
                    {verifyResult.discrepancies.orphanedInDiscourse.length}
                  </strong>{" "}
                  missing URLs will be repaired and{" "}
                  <strong>
                    {verifyResult.discrepancies.missingStatus.length}
                  </strong>{" "}
                  sync statuses will be updated.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRepair}>
              <Wrench className="w-4 h-4 mr-2" />
              Repair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
