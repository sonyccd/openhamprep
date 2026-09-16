import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Mail } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface CheckEmailScreenProps {
  /** Runs up to the address, e.g. "We've sent a confirmation link to". */
  leadIn: string;
  email: string;
  /** Runs after it — the two screens name different actions. */
  closing: string;
  footnote: string;
  onBack: () => void;
}

/**
 * "Check Your Email", shown after a signup and after a reset request.
 *
 * The two screens were separate copies differing only in their two sentences.
 */
export function CheckEmailScreen({
  leadIn,
  email,
  closing,
  footnote,
  onBack,
}: CheckEmailScreenProps) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
        }}
      >
        <Box
          component={Mail}
          aria-hidden="true"
          sx={{ width: 32, height: 32, color: "primary.main" }}
        />
      </Box>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        Check Your Email
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 3 }}>
        {leadIn}{" "}
        <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
          {email}
        </Box>
        . {closing}
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
        {footnote}
      </Typography>
      <Button variant="outlined" fullWidth onClick={onBack}>
        Back to Sign In
      </Button>
    </Box>
  );
}
