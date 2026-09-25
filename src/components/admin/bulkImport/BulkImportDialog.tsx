import { Icon } from "@/components/ohp/Icon";
import { useId, type ReactNode } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { Upload } from "lucide-react";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title for the upload step; the conflict step names itself. */
  title: string;
  /** The conflict step is wider and supplies its own footer. */
  inConflictStep: boolean;
  conflictContent?: ReactNode;
  children: ReactNode;
  /** Footer for the upload step. */
  actions: ReactNode;
}

/**
 * The trigger, dialog frame and step switch shared by both bulk importers.
 *
 * The two files held byte-identical copies of this: same trigger, same
 * "Resolve Import Conflicts" title swap, same 4xl/2xl width swap, same
 * scrolling column. Only the upload-step title differed.
 *
 * The width swap is expressed in pixels rather than a `maxWidth` breakpoint
 * because the originals used Tailwind's max-w-4xl (896px) and max-w-2xl
 * (672px), and MUI's nearest breakpoints are neither.
 */
export function BulkImportDialog({
  open,
  onOpenChange,
  title,
  inConflictStep,
  conflictContent,
  children,
  actions,
}: BulkImportDialogProps) {
  const id = useId();

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => onOpenChange(true)}
        startIcon={<Icon icon={Upload} size={16} />}
      >
        Bulk Import
      </Button>

      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
        fullWidth
        maxWidth={false}
        aria-labelledby={`${id}-title`}
        slotProps={{
          paper: {
            sx: {
              maxWidth: inConflictStep ? 896 : 672,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <DialogTitle id={`${id}-title`}>
          {inConflictStep ? "Resolve Import Conflicts" : title}
        </DialogTitle>

        {inConflictStep ? (
          <DialogContent>{conflictContent}</DialogContent>
        ) : (
          <>
            <DialogContent
              sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 }}
            >
              {children}
            </DialogContent>
            <DialogActions>{actions}</DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
