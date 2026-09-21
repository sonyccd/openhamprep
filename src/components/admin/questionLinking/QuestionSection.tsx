import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

interface QuestionSectionProps {
  title: string;
  count: number;
  /** How the count is drawn: filled for what is linked, outlined for what could be. */
  countVariant: "filled" | "outlined";
  maxHeight?: number;
  /** Shown instead of the list when there are no rows. */
  empty?: React.ReactNode;
  children?: React.ReactNode;
}

/** A titled, counted, bordered list of question rows that scrolls past a height. */
export function QuestionSection({ title, count, countVariant, maxHeight = 350, empty, children }: QuestionSectionProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography component="h4" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 500 }}>
        {title}
        {/* A Chip is a div; inside a heading it has to be a span. */}
        <Chip component="span" size="small" label={count} variant={countVariant} {...(countVariant === "filled" && { color: "secondary" })} />
      </Typography>
      {count === 0 && empty ? (
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", py: 2, textAlign: "center" }}>{empty}</Typography>
      ) : (
        <List
          disablePadding
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            maxHeight,
            overflowY: "auto",
            "& > li + li": { borderTop: "1px solid", borderColor: "divider" },
          }}
        >
          {children}
        </List>
      )}
    </Box>
  );
}
