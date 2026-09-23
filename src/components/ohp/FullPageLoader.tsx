import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

interface FullPageLoaderProps {
  /** What is being waited for, e.g. "Loading page". */
  label?: string;
}

/** A centred spinner filling the viewport, for a route that has nothing to show yet. */
export function FullPageLoader({ label = "Loading" }: FullPageLoaderProps) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress size={32} />
    </Box>
  );
}
