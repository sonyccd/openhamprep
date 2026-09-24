import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Settings,
} from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import { Topic, useTopicQuestions } from "@/hooks/useTopics";
import { TopicMarkdownEditor } from "./TopicMarkdownEditor";
import { TopicResourceManager } from "./TopicResourceManager";
import { TopicQuestionManager } from "./TopicQuestionManager";
import type { EditHistoryEntry } from "./EditHistoryViewer";
import { ConfirmDeleteDialog } from "./shared/ConfirmDeleteDialog";
import { TopicSettingsTab, type TopicSettings } from "./topics/TopicSettingsTab";
import { useTopicEditor } from "./topics/useTopicEditor";

interface TopicEditorProps {
  topic: Topic;
  onBack: () => void;
}

const TAB_IDS = ["content", "questions", "resources", "settings"] as const;

export function TopicEditor({ topic, onBack }: TopicEditorProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [settings, setSettings] = useState<TopicSettings>({
    title: topic.title,
    slug: topic.slug,
    description: topic.description || "",
    licenseTypes: topic.license_types || [],
    isPublished: topic.is_published,
    displayOrder: topic.display_order || 0,
  });

  const { data: linkedQuestions } = useTopicQuestions(topic.id);
  const { freshTopic, updateSettingsMutation, deleteTopicMutation } = useTopicEditor({
    topic,
    settings,
    onSaved: () => setHasSettingsChanges(false),
    onDeleted: onBack,
  });

  const changeSettings = (next: TopicSettings) => {
    setSettings(next);
    setHasSettingsChanges(true);
  };

  const isPublished = freshTopic?.is_published ?? topic.is_published;
  const questionCount = linkedQuestions?.length || 0;
  // Falls back to the prop like the title and slug above, so the count is right
  // on first paint instead of appearing once the detail query lands.
  const resourceCount = (freshTopic?.resources ?? topic.resources)?.length || 0;

  const panelProps = (index: number) => ({
    role: "tabpanel" as const,
    hidden: activeTab !== index,
    id: `topic-panel-${TAB_IDS[index]}`,
    "aria-labelledby": `topic-tab-${TAB_IDS[index]}`,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={onBack}
            startIcon={<Icon icon={ArrowLeft} size={16} />}
            sx={{ ml: -1, color: "text.primary" }}
          >
            Back
          </Button>
          <Box>
            <Typography component="h2" sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {freshTopic?.title || topic.title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                /{freshTopic?.slug || topic.slug}
              </Typography>
              {isPublished ? (
                <Chip
                  size="small"
                  icon={<Icon icon={Eye} size={12} />}
                  label="Published"
                  sx={{
                    fontSize: "0.75rem",
                    color: "success.main",
                    bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 20),
                    "& .MuiChip-icon": { color: "success.main" },
                  }}
                />
              ) : (
                <Chip
                  color="secondary"
                  size="small"
                  icon={<Icon icon={EyeOff} size={12} />}
                  label="Draft"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_event, next) => setActiveTab(next)}
        aria-label="Topic sections"
        sx={{ flexShrink: 0, mb: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab
          label="Content"
          icon={<Icon icon={FileText} size={16} />}
          iconPosition="start"
          id="topic-tab-content"
          aria-controls="topic-panel-content"
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Questions
              {questionCount > 0 && <Chip color="secondary" size="small" label={questionCount} />}
            </Box>
          }
          icon={<Icon icon={HelpCircle} size={16} />}
          iconPosition="start"
          id="topic-tab-questions"
          aria-controls="topic-panel-questions"
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Resources
              {resourceCount > 0 && <Chip color="secondary" size="small" label={resourceCount} />}
            </Box>
          }
          icon={<Icon icon={LinkIcon} size={16} />}
          iconPosition="start"
          id="topic-tab-resources"
          aria-controls="topic-panel-resources"
        />
        <Tab
          label="Settings"
          icon={<Icon icon={Settings} size={16} />}
          iconPosition="start"
          id="topic-tab-settings"
          aria-controls="topic-panel-settings"
        />
      </Tabs>

      <Box {...panelProps(0)} sx={{ flex: 1, minHeight: 0 }}>
        {activeTab === 0 && (
          <TopicMarkdownEditor
            topicId={topic.id}
            topicSlug={freshTopic?.slug || topic.slug}
            initialContent={freshTopic?.content || topic.content}
          />
        )}
      </Box>

      <Box {...panelProps(1)} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {activeTab === 1 && <TopicQuestionManager topicId={topic.id} />}
      </Box>

      <Box {...panelProps(2)} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {activeTab === 2 && (
          <TopicResourceManager topicId={topic.id} resources={freshTopic?.resources || []} />
        )}
      </Box>

      <Box {...panelProps(3)} sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {activeTab === 3 && (
          <TopicSettingsTab
            value={settings}
            onChange={changeSettings}
            onGenerateSlug={() =>
              changeSettings({
                ...settings,
                slug: settings.title
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, "")
                  .replace(/\s+/g, "-"),
              })
            }
            editHistory={(freshTopic?.edit_history as EditHistoryEntry[]) || []}
            hasChanges={hasSettingsChanges}
            isSaving={updateSettingsMutation.isPending}
            isDeleting={deleteTopicMutation.isPending}
            onSave={() => updateSettingsMutation.mutate()}
            onDelete={() => setShowDeleteDialog(true)}
          />
        )}
      </Box>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        title="Delete Topic"
        description={`Are you sure you want to delete "${topic.title}"? This will permanently remove the topic, all linked resources, and user progress data. This action cannot be undone.`}
        isPending={deleteTopicMutation.isPending}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          deleteTopicMutation.mutate();
        }}
      />
    </Box>
  );
}
