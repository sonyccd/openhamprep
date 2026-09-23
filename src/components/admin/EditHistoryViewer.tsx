import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import { Clock, History, User } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

export interface EditHistoryEntry {
  user_id: string;
  user_email: string;
  action: "created" | "updated" | "deleted";
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: string;
}

interface EditHistoryViewerProps {
  history: EditHistoryEntry[];
}

const ACTION_TOKEN: Record<EditHistoryEntry["action"], "success" | "primary" | "error"> = {
  created: "success",
  updated: "primary",
  deleted: "error",
};

const tinyIcon = { width: 12, height: 12 } as const;
const truncate = { maxWidth: "45%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;
const metaSx = { display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.75rem", color: "text.secondary" } as const;

/** Empty, null and JSON values all have to read as something. */
const formatChangeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "(empty)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/** Who changed what, newest first, behind a disclosure. */
export function EditHistoryViewer({ history }: EditHistoryViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length === 0) {
    return (
      <Typography sx={{ ...metaSx, fontSize: "0.875rem", fontStyle: "italic", py: 1 }}>
        <Box component={History} aria-hidden="true" sx={{ width: 16, height: 16 }} />
        No edit history recorded
      </Typography>
    );
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Box>
      <Button
        variant="text"
        color="inherit"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        startIcon={<Box component={History} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        sx={{ width: "100%", justifyContent: "flex-start", gap: 1, color: "text.secondary", "&:hover": { color: "text.primary" } }}
      >
        Edit History ({history.length} {history.length === 1 ? "change" : "changes"})
      </Button>

      <Collapse in={isOpen} unmountOnExit>
        <Box
          sx={{
            height: 200,
            overflowY: "auto",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 20),
            mt: 1,
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {sortedHistory.map((entry, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    size="small"
                    label={entry.action}
                    sx={{
                      color: `${ACTION_TOKEN[entry.action]}.main`,
                      bgcolor: (t) => tokenAlpha(t.vars.palette[ACTION_TOKEN[entry.action]].main, 20),
                    }}
                  />
                  <Box component="span" sx={metaSx}>
                    <Box component={User} aria-hidden="true" sx={tinyIcon} />
                    {entry.user_email}
                  </Box>
                </Box>
                <Box component="span" sx={metaSx}>
                  <Box component={Clock} aria-hidden="true" sx={tinyIcon} />
                  {format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}
                </Box>
              </Box>

              {entry.action === "updated" && Object.keys(entry.changes).length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, fontSize: "0.75rem" }}>
                  {Object.entries(entry.changes).map(([field, change]) => (
                    <Box key={field} sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Box component="span" sx={{ fontWeight: 500 }}>
                        {field}:
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, pl: 1 }}>
                        <Box
                          component="span"
                          sx={{ ...truncate, color: (t) => tokenAlpha(t.vars.palette.error.main, 80), textDecoration: "line-through" }}
                        >
                          {formatChangeValue(change.from)}
                        </Box>
                        <Box component="span" aria-label="changed to" sx={{ color: "text.secondary" }}>
                          →
                        </Box>
                        <Box component="span" sx={{ ...truncate, color: "success.main" }}>
                          {formatChangeValue(change.to)}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
