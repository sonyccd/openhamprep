import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import { ChevronRight } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

/**
 * A row in the settings menu.
 *
 * Lives in its own file rather than inside ProfileModal's render body, which is
 * where it used to be defined. A component created during render is a new type
 * on every render, so React unmounts and remounts its whole subtree instead of
 * updating it. That was measurable: typing one character into the display name
 * field replaced the input's DOM node, and only `autoFocus` re-firing on the
 * new node made it look like it worked.
 */
interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

export function ProfileMenuItem({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
}: ProfileMenuItemProps) {
  const danger = variant === "danger";

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        gap: 2,
        p: 2,
        borderRadius: 3,
        alignItems: "center",
        ...(danger && { color: "error.main" }),
        "&:hover": {
          bgcolor: (theme) =>
            danger
              ? tokenAlpha(theme.vars.palette.error.main, 10)
              : tokenAlpha(theme.vars.palette.secondary.main, 60),
        },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: danger ? "error.main" : "primary.main",
          bgcolor: (theme) =>
            tokenAlpha(
              danger ? theme.vars.palette.error.main : theme.vars.palette.primary.main,
              10,
            ),
        }}
      >
        <Box component={Icon} aria-hidden="true" sx={{ width: 20, height: 20 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" component="span" sx={{ display: "block", fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            component="span"
            sx={{
              display: "block",
              color: "text.secondary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Box
        component={ChevronRight}
        aria-hidden="true"
        sx={{
          width: 20,
          height: 20,
          flexShrink: 0,
          color: (theme) =>
            danger ? tokenAlpha(theme.vars.palette.error.main, 50) : "text.secondary",
        }}
      />
    </ListItemButton>
  );
}
