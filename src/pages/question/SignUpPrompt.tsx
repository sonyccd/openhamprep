import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { UserPlus } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface SignUpPromptProps {
  onSignUp: () => void;
}

/**
 * Shown above the question to a guest. Says what an account enables, never
 * why they should want one (docs/superpowers/specs guest-mode copy rule).
 */
export function SignUpPrompt({ onSignUp }: SignUpPromptProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ maxWidth: 768, mx: "auto", mb: 3 }}
    >
      <Box
        role="region"
        aria-label="Sign up call to action"
        sx={{
          border: "1px solid",
          borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 20),
          borderRadius: "12px",
          p: 2.5,
          background: (t) =>
            `linear-gradient(to right, ${tokenAlpha(t.vars.palette.primary.main, 10)}, ${tokenAlpha(
              t.vars.palette.primary.main,
              5
            )}, ${tokenAlpha(t.vars.palette.accent, 10)})`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
          <Typography sx={{ fontWeight: 500 }}>Want to track your progress?</Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            Create a free account to bookmark questions & access study tools.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={onSignUp}
          startIcon={<Icon icon={UserPlus} size={16} />}
          sx={{ flexShrink: 0, boxShadow: 3, "&:hover": { boxShadow: 6 } }}
        >
          Create Free Account
        </Button>
      </Box>
    </MotionBox>
  );
}
