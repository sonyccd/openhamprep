import { useId } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import { tokenAlpha } from "@/theme/muiTheme";
import { QuestionIdTag } from "@/components/admin/shared/QuestionIdTag";

export interface PickableQuestion {
  display_name: string;
  question: string;
}

interface QuestionPickRowProps {
  question: PickableQuestion;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Anything to show beside the id, such as an "in another chapter" chip. */
  badge?: React.ReactNode;
  /** Anything to show at the far end, such as an unlink mark. */
  trailing?: React.ReactNode;
}

/**
 * One question the admin can pick. The whole row is the control; the
 * checkbox is display only (tabIndex -1), as in MUI's checkbox-list idiom.
 */
export function QuestionPickRow({ question, checked, onClick, disabled = false, badge, trailing }: QuestionPickRowProps) {
  const labelId = useId();

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={onClick}
        disabled={disabled}
        sx={{
          alignItems: "flex-start",
          gap: 1.5,
          p: 1.5,
          ...(checked && { bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 5) }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mt: -0.5 }}>
          <Checkbox
            edge="start"
            checked={checked}
            tabIndex={-1}
            disableRipple
            size="small"
            slotProps={{ input: { "aria-labelledby": labelId } }}
            sx={{ p: 0.5 }}
          />
        </ListItemIcon>
        <Box sx={{ flex: 1, minWidth: 0 }} id={labelId}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuestionIdTag name={question.display_name} />
            {badge}
          </Box>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {question.question}
          </Typography>
        </Box>
        {trailing}
      </ListItemButton>
    </ListItem>
  );
}
