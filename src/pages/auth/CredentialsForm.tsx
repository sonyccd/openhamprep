import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { Mail, User } from "lucide-react";
import { PasswordField } from "./PasswordField";
import type { useAuthForm } from "./useAuthForm";

interface CredentialsFormProps {
  form: ReturnType<typeof useAuthForm>;
}

const startIcon = (icon: typeof Mail) => ({
  startAdornment: (
    <InputAdornment position="start">
      <Box
        component={icon}
        aria-hidden="true"
        sx={{ width: 16, height: 16, color: "text.secondary" }}
      />
    </InputAdornment>
  ),
});

/**
 * Email, password, and — on sign-up — a display name and confirmation.
 *
 * Every error here used to be a loose <p> under its input, with no aria-invalid
 * and nothing linking the two, so a screen reader met the message as stray text
 * rather than as a problem with the field. TextField carries both together.
 */
export function CredentialsForm({ form }: CredentialsFormProps) {
  return (
    <Box component="form" onSubmit={form.submit}>
      <Stack spacing={2}>
        {!form.isLogin && (
          <TextField
            id="displayName"
            label="Display Name (optional)"
            placeholder="Your name"
            value={form.displayName}
            onChange={(event) => form.setDisplayName(event.target.value)}
            autoComplete="name"
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              input: startIcon(User),
              htmlInput: { maxLength: 50 },
            }}
          />
        )}

        <TextField
          id="email"
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
          slotProps={{ inputLabel: { shrink: true }, input: startIcon(Mail) }}
        />

        <Box>
          <PasswordField
            id="password"
            label="Password"
            value={form.password}
            onChange={(value) => {
              form.setPassword(value);
              form.clearError("password");
            }}
            error={form.errors.password}
            autoComplete={form.isLogin ? "current-password" : "new-password"}
          />
          {form.isLogin && (
            <Link
              component="button"
              type="button"
              onClick={form.openForgotPassword}
              underline="hover"
              sx={{ fontSize: "0.875rem", mt: 0.5, display: "inline-block" }}
            >
              Forgot password?
            </Link>
          )}
        </Box>

        {!form.isLogin && (
          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(value) => {
              form.setConfirmPassword(value);
              form.clearError("confirmPassword");
            }}
            error={form.errors.confirmPassword}
            autoComplete="new-password"
          />
        )}

        <Button type="submit" variant="contained" fullWidth disabled={form.isSubmitting}>
          {form.isSubmitting ? (
            <CircularProgress size={16} color="inherit" aria-label="Submitting" />
          ) : form.isLogin ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </Button>
      </Stack>
    </Box>
  );
}
