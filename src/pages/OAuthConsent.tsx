import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AlertCircle, MessageCircle } from "lucide-react";
import { useOAuthConsent } from "@/hooks/useOAuthConsent";
import { tokenAlpha } from "@/theme/muiTheme";

const centredPage = {
  minHeight: "100vh",
  bgcolor: "background.default",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 2,
} as const;

export default function OAuthConsent() {
  const {
    isLoading,
    error,
    authorizationDetails,
    isProcessing,
    isAutoApproving,
    handleApprove,
    handleCancel,
  } = useOAuthConsent();

  const [forumUsername, setForumUsername] = useState("");

  if (isLoading || isAutoApproving) {
    const message = isAutoApproving ? "Connecting to the forum..." : "Loading...";
    return (
      <Box sx={centredPage}>
        <Box sx={{ textAlign: "center" }}>
          {/* The visible text names the spinner, so it needs no second label. */}
          <CircularProgress aria-labelledby="oauth-consent-status" />
          <Typography id="oauth-consent-status" sx={{ color: "text.secondary", mt: 2 }}>
            {message}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={centredPage}>
        <Card variant="outlined" sx={{ width: "100%", maxWidth: 448 }}>
          {/* disableTypography: CardHeader otherwise wraps the title in a
              Typography forced to component="span", which styles it like a
              heading while exposing nothing — and makes any block element
              passed here invalid inside that span. */}
          <CardHeader
            disableTypography
            title={
              <Typography
                variant="h6"
                component="h1"
                sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}
              >
                <Icon icon={AlertCircle} size={20} />
                Authorization Error
              </Typography>
            }
          />
          <CardContent>
            <Alert severity="error">{error}</Alert>
          </CardContent>
          <CardActions>
            <Button variant="outlined" fullWidth onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardActions>
        </Card>
      </Box>
    );
  }

  if (!authorizationDetails) {
    return null;
  }

  return (
    <Box sx={centredPage}>
      <Card variant="outlined" sx={{ width: "100%", maxWidth: 448 }}>
        <CardHeader
          disableTypography
          sx={{ textAlign: "center" }}
          title={
            <>
              <Box
                sx={{
                  mx: "auto",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Icon icon={MessageCircle} size={24} sx={{ color: "primary.main" }} />
              </Box>
              <Typography variant="h6" component="h1">
                Create Your Forum Username
              </Typography>
            </>
          }
          subheader={
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Choose a username to use on the Open Ham Prep forum. This will be visible to other
              users.
            </Typography>
          }
        />

        <CardContent>
          <TextField
            id="forum-username"
            label="Forum Username"
            placeholder="Choose a username"
            value={forumUsername}
            onChange={(event) => setForumUsername(event.target.value)}
            disabled={isProcessing}
            helperText="3-20 characters: letters, numbers, underscores, or hyphens."
            slotProps={{ inputLabel: { shrink: true } }}
            autoFocus
            fullWidth
          />
        </CardContent>

        <CardActions sx={{ gap: 1.5, px: 2, pb: 2 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={isProcessing} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleApprove(forumUsername)}
            disabled={isProcessing || !forumUsername.trim()}
            sx={{ flex: 1 }}
            startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isProcessing ? "Saving..." : "Continue to Forum"}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
