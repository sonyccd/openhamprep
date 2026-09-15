import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ImportWarningPanel } from "./ImportWarningPanel";

interface QuestionImportWarningsProps {
  warnings: string[];
  /** True when a warning means the file's answer keys may be 1-based. */
  requiresConfirmation: boolean;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}

/**
 * The parse warnings, kept on screen rather than passing by as a toast, plus
 * the confirmation that unlocks import for a suspected 1-based answer key.
 */
export function QuestionImportWarnings({
  warnings,
  requiresConfirmation,
  confirmed,
  onConfirmedChange,
}: QuestionImportWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <ImportWarningPanel
      heading={`${warnings.length} warning${warnings.length > 1 ? "s" : ""}`}
    >
      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 2.5,
          listStyleType: "disc",
          fontSize: "0.75rem",
          color: "text.secondary",
        }}
      >
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </Box>
      {requiresConfirmation && (
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={confirmed}
              onChange={(event) => onConfirmedChange(event.target.checked)}
            />
          }
          /* Details (0-based mapping, 4 rejected, false-positive note) live in
             the ONE_BASED_KEY_WARNING bullet above, so they aren't restated. */
          label="I've verified these answer keys are 0-based — import anyway."
          slotProps={{ typography: { sx: { fontSize: "0.75rem", fontWeight: 500 } } }}
          sx={{ mt: 1, ml: 0, alignItems: "flex-start" }}
        />
      )}
    </ImportWarningPanel>
  );
}
