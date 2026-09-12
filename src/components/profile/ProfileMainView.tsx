import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Accessibility, LogOut, Palette, User } from "lucide-react";
import { ProfileMenuItem } from "./ProfileMenuItem";
import { tokenAlpha } from "@/theme/muiTheme";
import type { SettingsView } from "./types";

interface ProfileMainViewProps {
  userInfo: { displayName: string | null; email: string | null };
  onNavigate: (view: SettingsView) => void;
  onSignOut?: () => void;
}

export function ProfileMainView({ userInfo, onNavigate, onSignOut }: ProfileMainViewProps) {
  return (
    <Stack spacing={1}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, mb: 1 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "primary.main",
            background: (theme) =>
              `linear-gradient(to bottom right, ${tokenAlpha(theme.vars.palette.primary.main, 20)}, ${tokenAlpha(theme.vars.palette.primary.main, 5)})`,
            outline: "2px solid",
            outlineColor: (theme) => tokenAlpha(theme.vars.palette.primary.main, 20),
          }}
        >
          <Box component={User} aria-hidden="true" sx={{ width: 28, height: 28 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {userInfo.displayName || "User"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userInfo.email}
          </Typography>
        </Box>
      </Box>

      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <ProfileMenuItem
          icon={User}
          label="Account"
          description="Name, email, password"
          onClick={() => onNavigate("account")}
        />
        <ProfileMenuItem
          icon={Palette}
          label="Appearance"
          description="Theme preferences"
          onClick={() => onNavigate("appearance")}
        />
        <ProfileMenuItem
          icon={Accessibility}
          label="Accessibility"
          description="Fonts, text size, contrast"
          onClick={() => onNavigate("accessibility")}
        />
      </List>

      {onSignOut && (
        <Box sx={{ pt: 2, mt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            onClick={onSignOut}
            fullWidth
            sx={{ justifyContent: "flex-start", gap: 1.5, color: "text.secondary" }}
            startIcon={<Box component={LogOut} sx={{ width: 20, height: 20 }} />}
          >
            Sign Out
          </Button>
        </Box>
      )}
    </Stack>
  );
}
