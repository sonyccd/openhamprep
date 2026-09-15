import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { EditHistoryEntry } from "../EditHistoryViewer";
import type {
  HamRadioTool,
  useCreateHamRadioTool,
  useDeleteHamRadioTool,
  useUpdateHamRadioTool,
} from "@/hooks/useHamRadioTools";
import { toolDraftError, type ToolDraft } from "./toolDraft";

interface UseToolAdminOptions {
  tools: HamRadioTool[];
  editingTool: HamRadioTool | null;
  /*
   * Taken from the hooks that produce them rather than restated as
   * { mutate: (vars: unknown, ...) }. The loose version compiled but threw away
   * the payload types, so a wrong field name in a mutate() call here would have
   * reached the database instead of the compiler.
   */
  createTool: ReturnType<typeof useCreateHamRadioTool>;
  updateTool: ReturnType<typeof useUpdateHamRadioTool>;
  deleteTool: ReturnType<typeof useDeleteHamRadioTool>;
  /** Called once a write lands, so the caller can close its dialog. */
  onAdded: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

/**
 * Create, update and delete for tools, including the edit-history bookkeeping.
 *
 * Lifted out of AdminHamRadioTools because CLAUDE.md asks for mutation logic to
 * live in hooks rather than inline in components, and the component was over
 * the line budget with it in place. The mutations themselves still come from
 * useHamRadioTools; this is the part that builds their payloads.
 */
export function useToolAdmin({
  tools,
  editingTool,
  createTool,
  updateTool,
  deleteTool,
  onAdded,
  onSaved,
  onDeleted,
}: UseToolAdminOptions) {
  const { user } = useAuth();

  const handleAddTool = (draft: ToolDraft) => {
    const invalid = toolDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (!user) { toast.error('Your session has expired. Please sign in again.'); return; }

    const historyEntry: EditHistoryEntry = {
      user_id: user.id,
      user_email: user.email || "Unknown",
      action: "created",
      changes: {},
      timestamp: new Date().toISOString(),
    };

    createTool.mutate(
      {
        title: draft.title.trim(),
        description: draft.description.trim(),
        url: draft.url.trim(),
        category_id: draft.categoryId || null,
        is_published: draft.isPublished,
        display_order: tools.length > 0 ? Math.max(...tools.map((t) => t.display_order)) + 1 : 0,
        image_url: null,
        storage_path: null,
        edit_history: [historyEntry],
      },
      {
        onSuccess: () => {
          onAdded();
          toast.success("Tool added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add tool: " + error.message);
        },
      }
    );
  };

  const handleUpdateTool = (draft: ToolDraft) => {
    if (!editingTool) return;
    const invalid = toolDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    if (!user) { toast.error('Your session has expired. Please sign in again.'); return; }

    /*
     * Typed to primitives on purpose. The diff below compares with !==, which
     * is right for strings, booleans and null but silently wrong for objects
     * and arrays — an array-valued field would read as changed on every save.
     * Annotating the payload means adding such a field fails to compile here
     * rather than quietly corrupting the edit history.
     */
    const next: Record<string, string | boolean | null> = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      url: draft.url.trim(),
      category_id: draft.categoryId || null,
      is_published: draft.isPublished,
      storage_path: draft.storagePath,
    };

    // Build changes object for edit history. The original compared six fields
    // by hand; iterating the payload keeps the record and the write in step.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(next)) {
      const before = editingTool[key as keyof HamRadioTool];
      if (before !== value) {
        changes[key] = { from: before, to: value };
      }
    }

    const historyEntry: EditHistoryEntry = {
      user_id: user.id,
      user_email: user.email || "Unknown",
      action: "updated",
      changes,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (editingTool.edit_history || []) as EditHistoryEntry[];

    updateTool.mutate(
      { id: editingTool.id, ...next, edit_history: [...existingHistory, historyEntry] },
      {
        onSuccess: () => {
          onSaved();
          toast.success("Tool updated successfully");
        },
        onError: (error) => {
          toast.error("Failed to update tool: " + error.message);
        },
      }
    );
  };

  const handleDeleteTool = () => {
    if (!editingTool) return;

    deleteTool.mutate(editingTool.id, {
      onSuccess: () => {
        onDeleted();
        toast.success("Tool deleted successfully");
      },
      onError: (error) => {
        toast.error("Failed to delete tool: " + error.message);
      },
    });
  };

  return { handleAddTool, handleUpdateTool, handleDeleteTool };
}
