import { useState } from "react";
import { Radio as RadioIcon, Zap, Award } from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import { tokenAlpha } from "@/theme/muiTheme";
import { TestType, testTypes, testConfig } from "@/types/navigation";

interface LicenseSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTest: TestType;
  onTestChange: (test: TestType) => void;
}

const licenseIcons: Record<TestType, React.ElementType> = {
  technician: RadioIcon,
  general: Zap,
  extra: Award,
};

const licenseDescriptions: Record<TestType, string> = {
  technician: "Entry-level license for new operators. 35 questions, need 26 to pass.",
  general: "Expanded HF privileges. 35 questions, need 26 to pass.",
  extra: "Full amateur privileges. 50 questions, need 37 to pass.",
};

export function LicenseSelectModal({
  open,
  onOpenChange,
  selectedTest,
  onTestChange,
}: LicenseSelectModalProps) {
  const [pendingSelection, setPendingSelection] = useState<TestType>(selectedTest);

  // Reset pending selection when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPendingSelection(selectedTest);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (pendingSelection !== selectedTest) {
      onTestChange(pendingSelection);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPendingSelection(selectedTest);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => handleOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Select License Class</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Choose which amateur radio license exam you want to study for.
        </DialogContentText>

        {/*
          A real RadioGroup of native <input type="radio">, which is what #274
          asked for. The previous version declared role="radiogroup" with
          role="radio" on three <button>s and implemented none of the APG
          keyboard contract: three tab stops instead of one, and arrow keys that
          did nothing. Announcing the role while ignoring its contract is worse
          than not using it.

          Nothing here re-implements that contract — the platform provides it.
          Radio renders type="radio" (Radio.js:195), so the browser gives arrow
          key selection, a single tab stop landing on the checked option, and
          grouping by name. Disabled options are skipped by arrow keys too.
        */}
        <RadioGroup
          aria-label="License class options"
          name="license-class"
          value={pendingSelection}
          onChange={(event) => setPendingSelection(event.target.value as TestType)}
          sx={{ gap: 1.5, py: 2 }}
        >
          {testTypes.map((test) => {
            const Icon = licenseIcons[test.id];
            const config = testConfig[test.id];
            const isSelected = pendingSelection === test.id;
            const isCurrent = selectedTest === test.id;

            return (
              <FormControlLabel
                key={test.id}
                value={test.id}
                disabled={!test.available}
                control={<Radio sx={{ alignSelf: "flex-start" }} />}
                sx={{
                  alignItems: "flex-start",
                  m: 0,
                  p: 2,
                  gap: 1,
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  bgcolor: (theme) =>
                    isSelected ? tokenAlpha(theme.vars.palette.primary.main, 5) : "transparent",
                  transition: "all 200ms",
                  "&:hover": {
                    borderColor: isSelected ? "primary.main" : "text.secondary",
                  },
                  "&.Mui-disabled": { opacity: 0.5 },
                }}
                label={
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1 }}>
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isSelected ? "primary.main" : "secondary.main",
                        color: isSelected ? "primary.contrastText" : "text.secondary",
                      }}
                    >
                      <Box component={Icon} aria-hidden="true" sx={{ width: 24, height: 24 }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography component="span" sx={{ fontWeight: 600 }}>
                          {test.name}
                        </Typography>
                        {/*
                          These were a hand-written aria-label before, listing
                          "(currently selected)" and "(coming soon)" alongside
                          the visible chips. The label content is the accessible
                          name now, so the two cannot drift apart.
                        */}
                        {isCurrent && <Chip size="small" label="Current" sx={{ bgcolor: "muted" }} />}
                        {!test.available && (
                          <Chip size="small" label="Coming Soon" sx={{ bgcolor: "muted" }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {licenseDescriptions[test.id]}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mt: 1,
                          fontSize: "0.75rem",
                          color: "text.secondary",
                        }}
                      >
                        <span>{config.questionCount} questions</span>
                        <span>{config.passingScore} to pass</span>
                        <span>74% passing</span>
                      </Box>
                    </Box>
                  </Box>
                }
              />
            );
          })}
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Button variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={pendingSelection === selectedTest}
        >
          {pendingSelection === selectedTest ? "No Change" : "Change License"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
