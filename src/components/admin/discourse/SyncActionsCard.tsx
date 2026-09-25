import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { RefreshCw, Search, Wrench } from "lucide-react";
import { format } from "date-fns";

const icon = { width: 16, height: 16 } as const;

interface SyncActionsCardProps {
  onVerify: () => void;
  isVerifying: boolean;
  onRepair: () => void;
  canRepair: boolean;
  isRepairing: boolean;
  onRefresh: () => void;
  lastVerified: Date | null;
}

/** Verify, repair (once a verification has found something to fix) and refresh. */
export function SyncActionsCard({
  onVerify,
  isVerifying,
  onRepair,
  canRepair,
  isRepairing,
  onRefresh,
  lastVerified,
}: SyncActionsCardProps) {
  return (
    <Card variant="outlined">
      <CardHeader
        disableTypography
        title={
          <Typography component="h3" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1rem", fontWeight: 600 }}>
            <Icon icon={Wrench} size={20} />
            Sync Actions
          </Typography>
        }
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onVerify}
            disabled={isVerifying}
            startIcon={isVerifying ? <CircularProgress size={16} color="inherit" /> : <Icon icon={Search} sx={icon} />}
          >
            {isVerifying ? "Verifying..." : "Verify Sync Status"}
          </Button>

          <Button
            variant="contained"
            onClick={onRepair}
            disabled={!canRepair}
            startIcon={isRepairing ? <CircularProgress size={16} color="inherit" /> : <Icon icon={Wrench} sx={icon} />}
          >
            {isRepairing ? "Repairing..." : "Repair Missing URLs"}
          </Button>

          <Button variant="text" color="inherit" onClick={onRefresh} startIcon={<Icon icon={RefreshCw} sx={icon} />}>
            Refresh
          </Button>
        </Box>

        {lastVerified && (
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Last verified: {format(lastVerified, "MMM d, yyyy h:mm a")}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
