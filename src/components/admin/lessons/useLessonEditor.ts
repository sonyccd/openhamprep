import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import type { Lesson } from "@/types/lessons";
import type { EditHistoryEntry } from "../EditHistoryViewer";
import type { LessonSettings } from "./LessonSettingsTab";

/** Order-insensitive compare that does not disturb either array. */
export const sameLicenses = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

interface UseLessonEditorOptions {
  lesson: Lesson;
  settings: LessonSettings;
  setSettings: React.Dispatch<React.SetStateAction<LessonSettings>>;
  onDeleted: () => void;
}

/**
 * Save, delete and publish for one lesson, including the edit-history
 * bookkeeping.
 *
 * Lifted out of LessonEditor for the same reason as useGlossaryAdmin (#303) and
 * useToolAdmin (#304): CLAUDE.md asks for mutation logic to live in hooks, and
 * the component was over the line budget with it inline.
 */
export function useLessonEditor({
  lesson,
  settings,
  setSettings,
  onDeleted,
}: UseLessonEditorOptions) {
  const { user } = useAuth();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const handleSave = () => {
    if (!settings.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!settings.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!user) { toast.error('Your session has expired. Please sign in again.'); return; }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (settings.title !== lesson.title) changes.title = { from: lesson.title, to: settings.title };
    if (settings.slug !== lesson.slug) changes.slug = { from: lesson.slug, to: settings.slug };
    if (settings.description !== (lesson.description || "")) {
      changes.description = { from: lesson.description, to: settings.description };
    }
    if (!sameLicenses(settings.licenseTypes, lesson.license_types || [])) {
      changes.license_types = { from: lesson.license_types, to: settings.licenseTypes };
    }
    if (settings.isPublished !== lesson.is_published) {
      changes.is_published = { from: lesson.is_published, to: settings.isPublished };
    }
    if (settings.displayOrder !== lesson.display_order) {
      changes.display_order = { from: lesson.display_order, to: settings.displayOrder };
    }

    const historyEntry: EditHistoryEntry = {
      user_id: user.id,
      user_email: user.email || "Unknown",
      action: "updated",
      changes,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (lesson.edit_history as EditHistoryEntry[]) || [];

    updateLesson.mutate(
      {
        id: lesson.id,
        title: settings.title.trim(),
        slug: settings.slug.trim().toLowerCase(),
        description: settings.description.trim() || null,
        license_types: settings.licenseTypes,
        is_published: settings.isPublished,
        display_order: settings.displayOrder,
        edit_history: [...existingHistory, historyEntry],
      },
      {
        onSuccess: () => {
          toast.success("Lesson saved successfully");
        },
        onError: (error) => {
          toast.error("Failed to save lesson: " + error.message);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteLesson.mutate(lesson.id, {
      onSuccess: () => {
        toast.success("Lesson deleted");
        onDeleted();
      },
      onError: (error) => {
        toast.error("Failed to delete lesson: " + error.message);
      },
    });
  };

  const handleTogglePublish = () => {
    if (!user) { toast.error('Your session has expired. Please sign in again.'); return; }
    const previousState = settings.isPublished;
    const newPublished = !previousState;
    setSettings((prev) => ({ ...prev, isPublished: newPublished }));

    // Auto-save publish status
    const historyEntry: EditHistoryEntry = {
      user_id: user.id,
      user_email: user.email || "Unknown",
      action: "updated",
      changes: { is_published: { from: previousState, to: newPublished } },
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (lesson.edit_history as EditHistoryEntry[]) || [];

    updateLesson.mutate(
      { id: lesson.id, is_published: newPublished, edit_history: [...existingHistory, historyEntry] },
      {
        onSuccess: () => {
          toast.success(newPublished ? "Lesson published" : "Lesson unpublished");
        },
        onError: () => {
          setSettings((prev) => ({ ...prev, isPublished: previousState })); // Proper revert
          toast.error("Failed to update publish status");
        },
      }
    );
  };

  return { handleSave, handleDelete, handleTogglePublish, updateLesson, deleteLesson };
}
