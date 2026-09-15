import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { Link as LinkIcon, Plus } from "lucide-react";
import type { TopicResource } from "@/hooks/useTopics";
import { ConfirmDeleteDialog } from "./shared/ConfirmDeleteDialog";
import { ResourceDialog } from "./topics/ResourceDialog";
import { ResourceFileField } from "./topics/ResourceFileField";
import { ResourceRow } from "./topics/ResourceRow";
import { useAddResourceForm } from "./topics/useAddResourceForm";
import { useTopicResources } from "./topics/useTopicResources";
import {
  EMPTY_RESOURCE_DRAFT,
  UPLOADABLE_TYPES,
  type ResourceDraft,
} from "./topics/resourceDraft";

interface TopicResourceManagerProps {
  topicId: string;
  resources: TopicResource[];
}

export function TopicResourceManager({ topicId, resources }: TopicResourceManagerProps) {
  const { addResource, updateResource, deleteResource, publicUrl } = useTopicResources(
    topicId,
    resources
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TopicResource | null>(null);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ResourceDraft>(EMPTY_RESOURCE_DRAFT);

  const addForm = useAddResourceForm({
    open: isAddOpen,
    onSubmit: (draft, file) =>
      addResource.mutate({ draft, file }, { onSuccess: () => setIsAddOpen(false) }),
  });

  const startEditing = (resource: TopicResource) => {
    setEditingResource(resource);
    setEditDraft({
      type: resource.resource_type,
      title: resource.title,
      url: resource.url || "",
      description: resource.description || "",
    });
  };

  const handleUpdate = () => {
    if (!editingResource || !editDraft.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    updateResource.mutate(
      { id: editingResource.id, draft: editDraft },
      { onSuccess: () => setEditingResource(null) }
    );
  };

  const sortedResources = [...resources].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component={LinkIcon}
            aria-hidden="true"
            sx={{ width: 20, height: 20, color: "primary.main" }}
          />
          <Typography variant="h6" component="h3" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            Resources
          </Typography>
          <Chip size="small" label={resources.length} />
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={() => setIsAddOpen(true)}
          startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
        >
          Add Resource
        </Button>
      </Box>

      {sortedResources.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: "text.secondary",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: "8px",
          }}
        >
          <Box
            component={LinkIcon}
            aria-hidden="true"
            sx={{ width: 32, height: 32, mx: "auto", mb: 1, opacity: 0.5, display: "block" }}
          />
          <Typography>No resources yet</Typography>
          <Typography sx={{ fontSize: "0.875rem" }}>
            Add videos, articles, and links for this topic
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {sortedResources.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              fileUrl={publicUrl}
              onEdit={() => startEditing(resource)}
              onDelete={() => setDeleteResourceId(resource.id)}
            />
          ))}
        </Stack>
      )}

      <ResourceDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Resource"
        submitLabel="Add Resource"
        showSubmitIcon
        draft={addForm.draft}
        onDraftChange={addForm.changeDraft}
        urlLabel={addForm.file ? "URL (optional - will use uploaded file)" : "URL"}
        isPending={addResource.isPending}
        onSubmit={addForm.submit}
      >
        {UPLOADABLE_TYPES.includes(addForm.draft.type) && (
          <ResourceFileField
            type={addForm.draft.type}
            file={addForm.file}
            onFileSelect={addForm.handleFileSelect}
            onClear={addForm.clearFile}
            inputRef={addForm.fileInputRef}
          />
        )}
      </ResourceDialog>

      <ResourceDialog
        open={!!editingResource}
        onClose={() => setEditingResource(null)}
        title="Edit Resource"
        submitLabel="Save Changes"
        draft={editDraft}
        onDraftChange={setEditDraft}
        isPending={updateResource.isPending}
        onSubmit={handleUpdate}
      />

      <ConfirmDeleteDialog
        open={!!deleteResourceId}
        title="Delete Resource"
        description="Are you sure you want to delete this resource? This action cannot be undone."
        isPending={deleteResource.isPending}
        onCancel={() => setDeleteResourceId(null)}
        onConfirm={() =>
          deleteResourceId &&
          deleteResource.mutate(deleteResourceId, {
            onSuccess: () => setDeleteResourceId(null),
          })
        }
      />
    </Stack>
  );
}
