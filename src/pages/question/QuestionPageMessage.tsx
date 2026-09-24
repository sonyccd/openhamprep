import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface QuestionPageMessageProps {
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

/** The full-page "we can't show you a question" screen, invalid id or missing. */
export function QuestionPageMessage({ title, children, actionLabel, onAction }: QuestionPageMessageProps) {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", px: 2 }}
    >
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ textAlign: "center", maxWidth: 480 }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: (t) => tokenAlpha(t.vars.palette.error.main, 10),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <Icon icon={AlertCircle} size={32} sx={{ color: "error.main" }} />
        </Box>
        <Typography component="h1" sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>{children}</Typography>
        <Button
          variant="contained"
          onClick={onAction}
          startIcon={<Icon icon={ArrowLeft} size={16} />}
        >
          {actionLabel}
        </Button>
      </MotionBox>
    </Box>
  );
}
