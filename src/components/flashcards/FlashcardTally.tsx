import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { tokenAlpha } from "@/theme/muiTheme";

/** One tally row: label, count, and the share of the session it represents. */
export function TallyBar({
  label,
  count,
  total,
  token,
}: {
  label: string;
  count: number;
  total: number;
  token: "success" | "error";
}) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.875rem",
          mb: 0.75,
        }}
      >
        <Box component="span" sx={{ color: `${token}.main`, fontWeight: 500 }}>
          {label}
        </Box>
        <Box component="span" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
          {count}
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={label}
        aria-valuetext={`${count} of ${total}`}
        sx={{
          height: 12,
          borderRadius: "9999px",
          bgcolor: "secondary.main",
          // The bars were gradients before the port; LinearProgress paints the
          // indicator, so the gradient moves onto its slot rather than being
          // dropped.
          "& .MuiLinearProgress-bar": {
            borderRadius: "9999px",
            background: (t) =>
              `linear-gradient(to right, ${t.vars.palette[token].main}, ${tokenAlpha(
                t.vars.palette[token].main,
                80
              )})`,
          },
        }}
      />
    </Box>
  );
}
