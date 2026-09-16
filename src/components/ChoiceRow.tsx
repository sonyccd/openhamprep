import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronRight } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface ChoiceRowProps {
  /** The short code in the leading tile — "T1", "3". */
  badge: ReactNode;
  title: string;
  onClick: () => void;
  /** Position in its list, for the staggered entrance. */
  index: number;
}

/**
 * One option in a pick-a-topic list: a badge, a title, a chevron.
 *
 * SubelementPractice and ChapterPractice rendered this with the same
 * class string, character for character. It is a MotionBox rendered as a
 * button rather than MUI's ButtonBase for the reason QuestionGroupList gives:
 * ButtonBase centres its content, and this is a left-aligned row.
 */
export function ChoiceRow({ badge, title, onClick, index }: ChoiceRowProps) {
  return (
    <MotionBox
      component="button"
      type="button"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      sx={{
        width: "100%",
        p: 2,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "text.primary",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        transition: "background-color 200ms, border-color 200ms, box-shadow 200ms",
        "&:hover": {
          bgcolor: "secondary.main",
          borderColor: (t) => tokenAlpha(t.vars.palette.text.primary, 20),
          boxShadow: 6,
        },
        "&:hover .ChoiceRow-chevron": { color: "text.primary" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: (t) => tokenAlpha(t.vars.palette.primary.main, 30),
          outlineOffset: 0,
        },
      }}
    >
      {/* Every layout box is a span: Box defaults to <div>, and a <button>
          takes phrasing content only. */}
      <Box
        component="span"
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            component="span"
            sx={{
              width: 48,
              height: 48,
              borderRadius: "8px",
              bgcolor: "secondary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {badge}
          </Box>
          {/* span: this sits inside a <button>, which takes phrasing content only. */}
          <Typography component="span" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Box
          component={ChevronRight}
          aria-hidden="true"
          className="ChoiceRow-chevron"
          sx={{ width: 20, height: 20, color: "text.secondary", transition: "color 150ms" }}
        />
      </Box>
    </MotionBox>
  );
}
