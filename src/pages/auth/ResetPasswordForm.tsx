import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Mail } from "lucide-react";
import type { useAuthForm } from "./useAuthForm";

interface ResetPasswordFormProps {
  form: ReturnType<typeof useAuthForm>;
}

/** Asks for an address and sends a reset link to it. */
export function ResetPasswordForm({ form }: ResetPasswordFormProps) {
  return (
    <>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
          Reset Password
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
      </Box>

      {form.formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {form.formError}
        </Alert>
      )}

      <Box component="form" onSubmit={form.submitForgotPassword}>
        <Stack spacing={2}>
          <TextField
            id="resetEmail"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => {
              form.setEmail(event.target.value);
              form.clearError("email");
            }}
            error={Boolean(form.errors.email)}
            helperText={form.errors.email}
            autoComplete="email"
            required
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      component={Mail}
                      aria-hidden="true"
                      sx={{ width: 16, height: 16, color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={form.isSubmitting}>
            {form.isSubmitting ? (
              <CircularProgress size={16} color="inherit" aria-label="Submitting" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Link
          component="button"
          type="button"
          onClick={form.backToSignInFromResetForm}
          underline="hover"
          sx={{ fontSize: "0.875rem", fontWeight: 500 }}
        >
          Back to Sign In
        </Link>
      </Box>
    </>
  );
}
