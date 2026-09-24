import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowLeft, RotateCcw, Zap } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";
import { TallyBar } from "./FlashcardTally";

interface FlashcardCompleteProps {
  knownCount: number;
  unknownCount: number;
  onBack: () => void;
  onRestart: () => void;
}

export function FlashcardComplete({
  knownCount,
  unknownCount,
  onBack,
  onRestart,
}: FlashcardCompleteProps) {
  const total = knownCount + unknownCount;
  const percentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

  return (
    <>
      <Button
        variant="text"
        onClick={onBack}
        startIcon={<Icon icon={ArrowLeft} size={16} />}
        sx={{ alignSelf: "flex-start", mb: 4, color: "text.secondary" }}
      >
        Back
      </Button>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MotionBox
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          sx={{ mb: 3 }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid",
              borderColor: (t) => tokenAlpha(t.vars.palette.success.main, 30),
              background: (t) =>
                `linear-gradient(to bottom right, ${tokenAlpha(
                  t.vars.palette.success.main,
                  20
                )}, ${tokenAlpha(t.vars.palette.success.main, 5)})`,
            }}
          >
            <Icon icon={Zap} size={40} sx={{ color: "success.main" }} />
          </Box>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{ textAlign: "center" }}
        >
          <Typography component="h1" sx={{ fontSize: "1.5rem", fontWeight: 700, mb: 1 }}>
            Session Complete
          </Typography>
          <Typography sx={{ color: "text.secondary", fontFamily: "monospace", mb: 4 }}>
            {total} CARDS REVIEWED
          </Typography>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          sx={{ width: "100%", maxWidth: 320, mb: 4 }}
        >
          <Paper variant="outlined" sx={{ borderRadius: 1, p: 3 }}>
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography sx={{ fontSize: "2.25rem", fontWeight: 700, fontFamily: "monospace" }}>
                {percentage}%
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Mastery
              </Typography>
            </Box>
            <Stack spacing={2}>
              <TallyBar label="Known" count={knownCount} total={total} token="success" />
              <TallyBar label="Need Review" count={unknownCount} total={total} token="error" />
            </Stack>
          </Paper>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          sx={{ display: "flex", gap: 1.5 }}
        >
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<Icon icon={ArrowLeft} size={16} />}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={onRestart}
            startIcon={<Icon icon={RotateCcw} size={16} />}
          >
            New Session
          </Button>
        </MotionBox>
      </Box>
    </>
  );
}
