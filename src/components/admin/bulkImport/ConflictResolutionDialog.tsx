import { Icon } from "@/components/ohp/Icon";
import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckCircle2, Database, GitMerge, Replace } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { ConflictRow } from "./ConflictRow";
import type { ConflictItem, ResolutionAction } from "./importTypes";

export type { ConflictItem, ResolutionAction } from "./importTypes";

interface ConflictResolutionDialogProps<T> {
  conflicts: ConflictItem<T>[];
  onResolve: (conflicts: ConflictItem<T>[]) => void;
  onCancel: () => void;
  renderExisting: (item: T) => ReactNode;
  renderIncoming: (item: T) => ReactNode;
  renderMerged: (existing: T, incoming: T) => ReactNode;
  getItemLabel: (item: T) => string;
  itemType: "question" | "term";
}

const TALLIES = [
  { action: "keep" as const, icon: Database, tone: "info" as const, label: "Keep" },
  { action: "replace" as const, icon: Replace, tone: "warning" as const, label: "Replace" },
  { action: "merge" as const, icon: GitMerge, tone: "success" as const, label: "Merge" },
];

/** The conflicts step: choose keep / replace / merge for each clashing item. */
export function ConflictResolutionDialog<T>({
  conflicts,
  onResolve,
  onCancel,
  renderExisting,
  renderIncoming,
  renderMerged,
  getItemLabel,
  itemType,
}: ConflictResolutionDialogProps<T>) {
  const [resolvedConflicts, setResolvedConflicts] = useState<ConflictItem<T>[]>(conflicts);
  // The first few open so the screen shows what a conflict looks like without
  // making the user click for it.
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(conflicts.slice(0, 3).map((c) => c.id))
  );

  const setResolution = (id: string, resolution: ResolutionAction) =>
    setResolvedConflicts((prev) => prev.map((c) => (c.id === id ? { ...c, resolution } : c)));

  const applyToAll = (resolution: ResolutionAction) =>
    setResolvedConflicts((prev) => prev.map((c) => ({ ...c, resolution })));

  const toggleExpand = (id: string) =>
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const countOf = (action: ResolutionAction) =>
    resolvedConflicts.filter((c) => c.resolution === action).length;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h6" component="h3">
            Resolve {conflicts.length} Conflicts
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            {conflicts.length} {itemType === "question" ? "questions" : "terms"} already exist in
            the database
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {TALLIES.map(({ action, icon, tone, label }) => (
            <Chip
              key={action}
              size="small"
              icon={<Icon icon={icon} size={12} />}
              label={`${countOf(action)} ${label}`}
              sx={{
                color: `${tone}.main`,
                bgcolor: (t) => tokenAlpha(t.vars.palette[tone].main, 20),
                "& .MuiChip-icon": { color: `${tone}.main` },
              }}
            />
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderRadius: "8px",
          bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Apply to all:
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => applyToAll("keep")}
          startIcon={<Icon icon={Database} size={12} />}
        >
          Keep Existing
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => applyToAll("replace")}
          startIcon={<Icon icon={Replace} size={12} />}
        >
          Replace All
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => applyToAll("merge")}
          startIcon={<Icon icon={GitMerge} size={12} />}
        >
          Merge All
        </Button>
      </Box>

      <Box
        sx={{
          height: 400,
          overflowY: "auto",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
        }}
      >
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          {resolvedConflicts.map((conflict) => (
            <ConflictRow
              key={conflict.id}
              label={getItemLabel(conflict.incoming)}
              resolution={conflict.resolution}
              onResolutionChange={(resolution) => setResolution(conflict.id, resolution)}
              isExpanded={expandedItems.has(conflict.id)}
              onToggleExpand={() => toggleExpand(conflict.id)}
              existing={renderExisting(conflict.existing)}
              outcome={
                conflict.resolution === "merge"
                  ? renderMerged(conflict.existing, conflict.incoming)
                  : renderIncoming(conflict.incoming)
              }
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onResolve(resolvedConflicts)}
          startIcon={<Icon icon={CheckCircle2} size={16} />}
        >
          Apply Resolutions
        </Button>
      </Box>
    </Stack>
  );
}
