import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Alert } from "@/hooks/useAlerts";

const labelSx = { fontSize: "0.75rem", fontWeight: 500 } as const;
const lineSx = { fontSize: "0.75rem", color: "text.secondary", mb: 1 } as const;

interface AlertContextDetailsProps {
  context: NonNullable<Alert["context"]>;
  acknowledgmentNote: string | null;
}

/** What the monitor saw when it raised the alert, plus any note left on acknowledging it. */
export function AlertContextDetails({ context, acknowledgmentNote }: AlertContextDetailsProps) {
  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 50),
      }}
    >
      {context.function_names && context.function_names.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography component="span" sx={labelSx}>
            Affected functions:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
            {context.function_names.map((fn) => (
              <Chip key={fn} color="secondary" size="small" label={fn} sx={{ fontSize: "0.75rem", fontFamily: "monospace" }} />
            ))}
          </Box>
        </Box>
      )}

      {context.error_count !== undefined && (
        <Typography sx={lineSx}>
          Error count:{" "}
          <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
            {context.error_count}
          </Box>
        </Typography>
      )}

      {context.consecutive_failures !== undefined && (
        <Typography sx={lineSx}>
          Consecutive failures:{" "}
          <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
            {context.consecutive_failures}
          </Box>
        </Typography>
      )}

      {context.matched_pattern && (
        <Typography sx={lineSx}>
          Matched pattern:{" "}
          <Box component="code" sx={{ bgcolor: "muted", px: 0.5, borderRadius: "4px" }}>
            {context.matched_pattern}
          </Box>
        </Typography>
      )}

      {context.sample_errors && context.sample_errors.length > 0 && (
        <Box>
          <Typography component="span" sx={labelSx}>
            Sample errors:
          </Typography>
          <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {context.sample_errors.map((err, i) => (
              <Box
                key={i}
                sx={{ fontSize: "0.75rem", fontFamily: "monospace", bgcolor: "muted", p: 1, borderRadius: 1, overflowX: "auto" }}
              >
                {err}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {acknowledgmentNote && (
        <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography component="span" sx={labelSx}>
            Acknowledgment note:
          </Typography>
          <Typography sx={{ ...lineSx, mb: 0, mt: 0.5 }}>{acknowledgmentNote}</Typography>
        </Box>
      )}
    </Box>
  );
}
