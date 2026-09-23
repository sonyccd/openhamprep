import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { tokenAlpha } from "@/theme/muiTheme";
import { ADMIN_SECTIONS } from "./adminSections";
import type { AdminSection } from "./adminSections";

interface AdminSectionNavProps {
  value: AdminSection;
  onChange: (section: AdminSection) => void;
  /** Sits on the Alerts button; hidden at zero. */
  unacknowledgedCount: number;
}

/**
 * Which part of the admin is on screen. A toggle group rather than a tablist:
 * two of the sections contain tablists of their own, and nesting them would
 * give the same name to a section and one of its tabs.
 */
export function AdminSectionNav({ value, onChange, unacknowledgedCount }: AdminSectionNavProps) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_e, next: AdminSection | null) => next && onChange(next)}
      aria-label="Admin section"
      sx={{
        bgcolor: (t) => tokenAlpha(t.vars.palette.muted, 50),
        borderRadius: "8px",
        p: 0.5,
        gap: 0.5,
        flexWrap: "wrap",
        "& .MuiToggleButton-root": {
          border: 0,
          borderRadius: "6px !important",
          px: 1.5,
          py: 0.75,
          gap: 0.75,
          fontSize: "0.875rem",
          fontWeight: 500,
          textTransform: "none",
          color: "text.secondary",
          "&:hover": { color: "text.primary", bgcolor: (t) => tokenAlpha(t.vars.palette.background.default, 50) },
          "&.Mui-selected": {
            bgcolor: "background.default",
            color: "text.primary",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.default" },
          },
        },
      }}
    >
      {ADMIN_SECTIONS.map(({ value: section, label, icon: Icon }) => {
        const icon = <Box component={Icon} aria-hidden="true" sx={{ width: 16, height: 16 }} />;
        const badged = section === "alerts" && unacknowledgedCount > 0;
        return (
          <ToggleButton key={section} value={section} aria-label={label}>
            {badged ? (
              // The count belongs to this one button; a Badge on the rest would
              // put its label on every section.
              <Badge
                badgeContent={unacknowledgedCount}
                max={9}
                color="error"
                slotProps={{ badge: { "aria-label": `${unacknowledgedCount} unacknowledged alerts` } }}
              >
                {icon}
              </Badge>
            ) : (
              icon
            )}
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {label}
            </Box>
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}
