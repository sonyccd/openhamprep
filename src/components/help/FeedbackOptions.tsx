import { Icon } from "@/components/ohp/Icon";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { Activity, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { REPORT_ICONS, STATUS_PAGE_URL } from "./helpForumUrl";
import type { ReportKind } from "./helpForumUrl";

/** A tinted round icon, the marker for one kind of report. */
export function OptionIcon({
  icon: Glyph,
  token,
  size = 40,
}: {
  icon: LucideIcon;
  token: "error" | "primary" | "success";
  size?: number;
}) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        color: `${token}.main`,
        bgcolor: (t) => tokenAlpha(t.vars.palette[token].main, 10),
      }}
    >
      <Icon icon={Glyph} sx={{ width: size / 2, height: size / 2 }} />
    </Avatar>
  );
}

const rowSx = {
  gap: 1.5,
  p: 1.5,
  borderRadius: "8px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  "&:hover": { bgcolor: "muted" },
} as const;

interface FeedbackOptionsProps {
  onPick: (kind: ReportKind) => void;
}

/** The three ways to get help: report a bug, give feedback, check status. */
export function FeedbackOptions({ onPick }: FeedbackOptionsProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
        Found a bug or have an idea to improve the app? Let us know on our community forum!
      </Typography>

      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => onPick("bug")} sx={rowSx}>
            <ListItemAvatar sx={{ minWidth: 0 }}>
              <OptionIcon {...REPORT_ICONS.bug} />
            </ListItemAvatar>
            <ListItemText
              primary="Report a Bug"
              secondary="Something not working? Let us know"
              slotProps={{ primary: { sx: { fontWeight: 500 } } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => onPick("feedback")} sx={rowSx}>
            <ListItemAvatar sx={{ minWidth: 0 }}>
              <OptionIcon {...REPORT_ICONS.feedback} />
            </ListItemAvatar>
            <ListItemText
              primary="Give Feedback"
              secondary="Share ideas or suggest features"
              slotProps={{ primary: { sx: { fontWeight: 500 } } }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href={STATUS_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={rowSx}
          >
            <ListItemAvatar sx={{ minWidth: 0 }}>
              <OptionIcon icon={Activity} token="success" />
            </ListItemAvatar>
            <ListItemText
              primary="System Status"
              secondary="Check if services are running smoothly"
              slotProps={{ primary: { sx: { fontWeight: 500 } } }}
            />
            <Icon icon={ExternalLink} size={16} sx={{ color: "text.secondary" }} />
            <Box component="span" sx={visuallyHidden}>
              (opens in new window)
            </Box>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
