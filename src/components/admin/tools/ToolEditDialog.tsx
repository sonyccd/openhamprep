import { Icon } from "@/components/ohp/Icon";
import { useEffect, useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import { Trash2 } from "lucide-react";
import { EditHistoryViewer, type EditHistoryEntry } from "../EditHistoryViewer";
import { HamRadioToolImageUpload } from "../HamRadioToolImageUpload";
import { ConfirmDeleteDialog } from "../shared/ConfirmDeleteDialog";
import { ToolFields } from "./ToolFields";
import { EMPTY_TOOL_DRAFT, isToolDraftValid, type ToolDraft } from "./toolDraft";
import type { HamRadioTool } from "@/hooks/useHamRadioTools";

interface ToolEditDialogProps {
  tool: HamRadioTool | null;
  onClose: () => void;
  categories: { id: string; name: string }[];
  isPending: boolean;
  /** Separate from isPending: a save and a delete can't both be in flight. */
  isDeleting?: boolean;
  onSubmit: (draft: ToolDraft) => void;
  onDelete: () => void;
}

export function ToolEditDialog({
  tool,
  onClose,
  categories,
  isPending,
  isDeleting = false,
  onSubmit,
  onDelete,
}: ToolEditDialogProps) {
  const id = useId();
  const [draft, setDraft] = useState<ToolDraft>(EMPTY_TOOL_DRAFT);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Refill from whichever tool was opened.
  useEffect(() => {
    if (tool) {
      setDraft({
        title: tool.title,
        description: tool.description,
        url: tool.url,
        categoryId: tool.category_id || "",
        isPublished: tool.is_published,
        storagePath: tool.storage_path,
      });
    }
  }, [tool]);

  return (
    <Dialog
      open={Boolean(tool)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={`${id}-title`}
      slotProps={{ paper: { sx: { maxHeight: "90vh" } } }}
    >
      <DialogTitle id={`${id}-title`}>Edit Tool</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <ToolFields value={draft} onChange={setDraft} categories={categories} />

          <Divider />

          <Box>
            <FormLabel component="legend" sx={{ mb: 1, display: "block" }}>
              Image
            </FormLabel>
            {tool && (
              <HamRadioToolImageUpload
                toolId={tool.id}
                currentStoragePath={draft.storagePath}
                onUpload={(storagePath) => setDraft({ ...draft, storagePath })}
                onRemove={() => setDraft({ ...draft, storagePath: null })}
              />
            )}
          </Box>

          <Divider />

          <EditHistoryViewer
            history={(tool?.edit_history || []) as EditHistoryEntry[]}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Button
              variant="text"
              color="error"
              onClick={() => setConfirmingDelete(true)}
              startIcon={<Icon icon={Trash2} size={16} />}
            >
              Delete Tool
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => onSubmit(draft)}
                disabled={isPending || !isToolDraftValid(draft)}
                startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <ConfirmDeleteDialog
        open={confirmingDelete}
        title="Delete Tool"
        description={`Are you sure you want to delete "${tool?.title}"? This action cannot be undone.`}
        isPending={isDeleting}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete();
        }}
      />
    </Dialog>
  );
}
