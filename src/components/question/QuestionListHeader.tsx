import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ArrowLeft } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface QuestionListHeaderProps {
  title: string;
  subtitle: string;
  badge: string;
  description?: string;
  onBack: () => void;
}

/** Back link, the chapter/subelement badge, and the title block. */
export function QuestionListHeader({
  title,
  subtitle,
  badge,
  description,
  onBack,
}: QuestionListHeaderProps) {
  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="text"
          onClick={onBack}
          startIcon={<Icon icon={ArrowLeft} size={16} />}
          sx={{ mb: 3, ml: -1, color: "text.primary" }}
        >
          Back
        </Button>

        <MotionBox
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ position: "relative" }}
        >
          {/* Decorative gradient bar */}
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: -16,
              top: 0,
              bottom: 0,
              width: 4,
              borderRadius: "9999px",
              background: (t) =>
                `linear-gradient(to bottom, ${t.vars.palette.primary.main}, ${tokenAlpha(
                  t.vars.palette.primary.main,
                  60
                )}, transparent)`,
            }}
          />

          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
              <Box
                sx={{
                  flexShrink: 0,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "6px", // rounded-md
                  bgcolor: (t) => tokenAlpha(t.vars.palette.primary.main, 10),
                  border: "1px solid",
                  borderColor: (t) => tokenAlpha(t.vars.palette.primary.main, 20),
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "primary.main",
                  fontSize: "0.875rem",
                  letterSpacing: "0.025em",
                }}
              >
                {badge}
              </Box>
            </Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.5rem", md: "1.875rem" },
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.025em",
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>{subtitle}</Typography>
          </Box>
        </MotionBox>
      </Box>

      {description && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 1, // rounded-xl, and shape.borderRadius is 12
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            component="p"
            sx={{ color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.625 }}
          >
            {description}
          </Typography>
        </MotionBox>
      )}
    </>
  );
}
