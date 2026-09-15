import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle2, GitMerge, Upload, XCircle } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

export interface ImportRowError {
  row: number;
  errors: string[];
}

interface ImportValidationSummaryProps<E extends ImportRowError> {
  validCount: number;
  errors: E[];
  /** Names the offending row — the two importers label rows differently. */
  errorLabel: (error: E) => string;
  conflictCount: number;
  newCount: number;
  isImporting: boolean;
  importProgress: number;
  importedCount: number;
  skippedCount: number;
}

/** Tallies, the per-row errors, and the progress bar once importing starts. */
export function ImportValidationSummary<E extends ImportRowError>({
  validCount,
  errors,
  errorLabel,
  conflictCount,
  newCount,
  isImporting,
  importProgress,
  importedCount,
  skippedCount,
}: ImportValidationSummaryProps<E>) {
  const tally = (
    icon: typeof CheckCircle2,
    token: "success" | "error" | "warning" | "info",
    label: string
  ) => (
    <Chip
      size="small"
      icon={<Box component={icon} sx={{ width: 12, height: 12 }} />}
      label={label}
      sx={{
        color: `${token}.main`,
        bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 20),
        "& .MuiChip-icon": { color: `${token}.main` },
      }}
    />
  );

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        {tally(CheckCircle2, "success", `${validCount} Valid`)}
        {errors.length > 0 && tally(XCircle, "error", `${errors.length} Errors`)}
        {conflictCount > 0 && tally(GitMerge, "warning", `${conflictCount} Conflicts`)}
        {newCount > 0 && tally(Upload, "info", `${newCount} New`)}
      </Box>

      {errors.length > 0 && (
        <Box
          sx={{
            flex: 1,
            maxHeight: 192,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            p: 1.5,
          }}
        >
          <Stack spacing={1}>
            {errors.map((err, idx) => (
              <Box
                key={idx}
                sx={{
                  fontSize: "0.875rem",
                  p: 1,
                  borderRadius: "4px",
                  bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
                  border: "1px solid",
                  borderColor: (t) => tokenAlpha(t.vars.palette.error.main, 20),
                }}
              >
                <Typography sx={{ fontWeight: 500, color: "error.main" }}>
                  {errorLabel(err)}
                </Typography>
                <Box
                  component="ul"
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    mt: 0.5,
                    pl: 2.5,
                    listStyleType: "disc",
                  }}
                >
                  {err.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {isImporting && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={importProgress}
            aria-label="Import progress"
            aria-valuetext={`${importedCount} imported, ${skippedCount} skipped`}
            sx={{ height: 8, borderRadius: "9999px" }}
          />
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", textAlign: "center" }}>
            Importing... {importedCount} imported, {skippedCount} skipped
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
