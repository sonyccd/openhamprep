import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Lesson } from "@/types/lessons";
import type { EditHistoryEntry } from "./EditHistoryViewer";
import { LessonTopicManager } from "./LessonTopicManager";
import { LessonEditorHeader } from "./lessons/LessonEditorHeader";
import { LessonSettingsTab, type LessonSettings } from "./lessons/LessonSettingsTab";
import { ConfirmDeleteDialog } from "./shared/ConfirmDeleteDialog";
import { sameLicenses, useLessonEditor } from "./lessons/useLessonEditor";

interface LessonEditorProps {
  lesson: Lesson;
  onBack: () => void;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export function LessonEditor({ lesson, onBack }: LessonEditorProps) {
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

  const { handleSave, handleDelete, handleTogglePublish, updateLesson, deleteLesson } =
    useLessonEditor({ lesson, settings, setSettings, onDeleted: onBack });

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
