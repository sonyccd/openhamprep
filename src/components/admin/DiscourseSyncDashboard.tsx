import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDiscourseSyncStatus, type VerifyResult } from "@/hooks/useDiscourseSyncStatus";
import { RepairConfirmDialog } from "./discourse/RepairConfirmDialog";
import { SyncActionsCard } from "./discourse/SyncActionsCard";
import { SyncByLicenseCard } from "./discourse/SyncByLicenseCard";
import { SyncOverviewCards } from "./discourse/SyncOverviewCards";
import { VerificationResults } from "./discourse/VerificationResults";
import { countDiscrepancies } from "./discourse/syncMetrics";

const describeError = (error: unknown) => (error instanceof Error ? error.message : "Unknown error");

export function DiscourseSyncDashboard() {
  const { overview, totals, isLoading, isError, verify, repair, refreshOverview } = useDiscourseSyncStatus();

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
      toast.error("Verification failed: " + describeError(error));
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
      toast.error("Repair failed: " + describeError(error));
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }} role="status" aria-label="Loading sync status">
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Icon icon={AlertTriangle} size={48} sx={{ color: "error.main", mx: "auto", mb: 2 }} />
        <Typography sx={{ color: "text.secondary" }}>
          Failed to load sync status. Make sure you have admin access.
        </Typography>
        <Button
          variant="outlined"
          onClick={refreshOverview}
          startIcon={<Icon icon={RefreshCw} size={16} />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Repair only has something to do once a verification has found problems.
  const canRepair = verifyResult !== null && countDiscrepancies(verifyResult) > 0 && !repair.isPending;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
      <SyncOverviewCards totals={totals} />

      {overview && overview.length > 0 && <SyncByLicenseCard overview={overview} />}

      <SyncActionsCard
        onVerify={handleVerify}
        isVerifying={verify.isPending}
        onRepair={() => setShowRepairDialog(true)}
        canRepair={canRepair}
        isRepairing={repair.isPending}
        onRefresh={refreshOverview}
        lastVerified={lastVerified}
      />

      {verifyResult && <VerificationResults result={verifyResult} />}

      <RepairConfirmDialog
        open={showRepairDialog}
        missingUrls={verifyResult?.discrepancies.orphanedInDiscourse.length ?? 0}
        missingStatuses={verifyResult?.discrepancies.missingStatus.length ?? 0}
        onCancel={() => setShowRepairDialog(false)}
        onConfirm={handleRepair}
      />
    </Box>
  );
}
