import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import { Lesson } from "@/types/lessons";
import { EditHistoryEntry } from "./EditHistoryViewer";
import { LessonTopicManager } from "./LessonTopicManager";
import { LessonEditorHeader } from "./lessons/LessonEditorHeader";
import { LessonSettingsTab, type LessonSettings } from "./lessons/LessonSettingsTab";
import { ConfirmDeleteDialog } from "./shared/ConfirmDeleteDialog";

interface LessonEditorProps {
  lesson: Lesson;
  onBack: () => void;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

/** Order-insensitive compare that does not disturb either array. */
const sameLicenses = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

export function LessonEditor({ lesson, onBack }: LessonEditorProps) {
  const { user } = useAuth();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [activeTab, setActiveTab] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [settings, setSettings] = useState<LessonSettings>({
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description || "",
    licenseTypes: lesson.license_types || ["technician", "general", "extra"],
    isPublished: lesson.is_published,
    displayOrder: lesson.display_order,
  });

  const hasChanges =
    settings.title !== lesson.title ||
    settings.slug !== lesson.slug ||
    settings.description !== (lesson.description || "") ||
    !sameLicenses(settings.licenseTypes, lesson.license_types || []) ||
    settings.isPublished !== lesson.is_published ||
    settings.displayOrder !== lesson.display_order;

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
        onBack();
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <LessonEditorHeader
        title={lesson.title}
        slug={lesson.slug}
        isPublished={settings.isPublished}
        isSaving={updateLesson.isPending}
        hasChanges={hasChanges}
        onBack={onBack}
        onTogglePublish={handleTogglePublish}
        onDelete={() => setIsDeleteDialogOpen(true)}
        onSave={handleSave}
      />

      <Tabs
        value={activeTab}
        onChange={(_event, next) => setActiveTab(next)}
        aria-label="Lesson sections"
        sx={{ flexShrink: 0, pt: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Topics" id="lesson-tab-0" aria-controls="lesson-panel-0" />
        <Tab label="Settings" id="lesson-tab-1" aria-controls="lesson-panel-1" />
      </Tabs>

      <Box
        role="tabpanel"
        hidden={activeTab !== 0}
        id="lesson-panel-0"
        aria-labelledby="lesson-tab-0"
        sx={{ flex: 1, overflowY: "auto", mt: 2 }}
      >
        {activeTab === 0 && (
          <Card variant="outlined">
            <CardContent sx={{ pt: 3 }}>
              <LessonTopicManager lessonId={lesson.id} topics={lesson.topics || []} />
            </CardContent>
          </Card>
        )}
      </Box>

      <Box
        role="tabpanel"
        hidden={activeTab !== 1}
        id="lesson-panel-1"
        aria-labelledby="lesson-tab-1"
        sx={{ flex: 1, overflowY: "auto", mt: 2 }}
      >
        {activeTab === 1 && (
          <LessonSettingsTab
            value={settings}
            onChange={setSettings}
            onGenerateSlug={() => setSettings((prev) => ({ ...prev, slug: slugify(prev.title) }))}
            editHistory={(lesson.edit_history as EditHistoryEntry[]) || []}
          />
        )}
      </Box>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        title="Delete Lesson?"
        description={`Are you sure you want to delete "${lesson.title}"? This action cannot be undone. The topics in this lesson will not be deleted, only the lesson grouping.`}
        isPending={deleteLesson.isPending}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          handleDelete();
        }}
      />
    </Box>
  );
}
