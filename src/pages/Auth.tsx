import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useAuth } from "@/hooks/useAuth";
import { OHPLogo } from "@/components/OHPLogo";
import { tokenAlpha } from "@/theme/muiTheme";
import { AuthDivider } from "./auth/AuthDivider";
import { AuthShell } from "./auth/AuthShell";
import { CheckEmailScreen } from "./auth/CheckEmailScreen";
import { CredentialsForm } from "./auth/CredentialsForm";
import { GoogleSignInButton } from "./auth/GoogleSignInButton";
import { ResetPasswordForm } from "./auth/ResetPasswordForm";
import { useAuthForm } from "./auth/useAuthForm";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [emailVerified, setEmailVerified] = useState(false);

  // Carried through the OAuth consent flow, so sign-in returns there.
  const returnTo = new URLSearchParams(location.search).get("returnTo");

  const form = useAuthForm({ returnTo, navigate });

  // Supabase sends the verification result back in the URL fragment.
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const queryParams = new URLSearchParams(location.search);

    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const error = hashParams.get("error");
    const errorDescription =
      hashParams.get("error_description") || queryParams.get("error_description");

    if (error) {
      form.setFormError(errorDescription || "Email verification failed. The link may have expired.");
    } else if (accessToken && type === "signup") {
      setEmailVerified(true);
      // Drop the fragment but keep the query, which still holds returnTo.
      window.history.replaceState(null, "", location.pathname + location.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (user) navigate(returnTo || "/");
  }, [user, navigate, returnTo]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }

  if (form.showEmailConfirmation) {
    return (
      <AuthShell padded>
        <CheckEmailScreen
          leadIn="We've sent a confirmation link to"
          email={form.email}
          closing="Please check your inbox and click the link to verify your account."
          footnote="Don't see the email? Check your spam folder or try signing up again."
          onBack={form.backToSignInFromConfirmation}
        />
      </AuthShell>
    );
  }

  if (form.showForgotPassword) {
    return (
      <AuthShell padded>
        {form.forgotPasswordSent ? (
          <CheckEmailScreen
            leadIn="We've sent a password reset link to"
            email={form.email}
            closing="Please check your inbox and click the link to reset your password."
            footnote="Don't see the email? Check your spam folder."
            onBack={form.backToSignInFromResetSent}
          />
        ) : (
          <ResetPasswordForm form={form} />
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <OHPLogo variant="horizontal" sx={{ height: 40 }} />
        </Box>
        <Typography sx={{ color: "text.secondary" }}>
          {form.isLogin ? "Sign in to track your progress" : "Create an account to get started"}
        </Typography>
      </Box>

      {emailVerified && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your email has been verified! You can now sign in to your account.
        </Alert>
      )}

      {form.formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {form.formError}
        </Alert>
      )}

      <CredentialsForm form={form} />

      <AuthDivider label="Or continue with" uppercase />

      <GoogleSignInButton onClick={form.signInWithGoogle} disabled={form.isSubmitting} />

      <AuthDivider label="or" />

      <ButtonBase
        onClick={() => navigate("/dashboard")}
        sx={{
          width: "100%",
          display: "block",
          textAlign: "left",
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "6px",
          px: 2,
          py: 1.5,
          "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.accent, 50) },
        }}
      >
        {/* component="span" with display:block: Typography's body variants map
            to <p>, and a <button> takes phrasing content only — so the default
            would put two <p> elements inside this button. */}
        <Typography component="span" sx={{ display: "block", fontSize: "0.875rem", fontWeight: 500 }}>
          Continue as guest →
        </Typography>
        <Typography
          component="span"
          sx={{ display: "block", fontSize: "0.875rem", color: "text.secondary" }}
        >
          Progress won't be saved
        </Typography>
      </ButtonBase>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Link
          component="button"
          type="button"
          onClick={form.toggleMode}
          underline="hover"
          sx={{ fontSize: "0.875rem", color: "text.secondary" }}
        >
          {form.isLogin ? (
            <>
              Don't have an account?{" "}
              <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>
                Sign up
              </Box>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>
                Sign in
              </Box>
            </>
          )}
        </Link>
      </Box>
    </AuthShell>
  );
}
