import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  Video,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  File,
  GripVertical,
  ExternalLink,
  Pencil,
  X,
  Upload,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TopicResource } from "@/hooks/useTopics";
import { cn } from "@/lib/utils";

interface TopicResourceManagerProps {
  topicId: string;
  resources: TopicResource[];
}

const RESOURCE_TYPES = [
  { value: "video", label: "Video", icon: Video, color: "text-red-500" },
  { value: "article", label: "Article", icon: FileText, color: "text-blue-500" },
  { value: "link", label: "Link", icon: LinkIcon, color: "text-purple-500" },
  { value: "pdf", label: "PDF", icon: File, color: "text-orange-500" },
  { value: "image", label: "Image", icon: ImageIcon, color: "text-green-500" },
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  // Note: SVG excluded due to XSS risk (can contain executable JavaScript)
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/ogg"],
  article: ["application/pdf", "text/plain", "text/markdown"],
};

export function TopicResourceManager({
  topicId,
  resources,
}: TopicResourceManagerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TopicResource | null>(null);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);

  // Form state for new resource
  const [newType, setNewType] = useState<string>("link");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for editing
  const [editType, setEditType] = useState<string>("link");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const addResourceMutation = useMutation({
    mutationFn: async ({
      type,
      title,
      url,
      description,
      file,
    }: {
      type: string;
      title: string;
      url: string;
      description: string;
      file: File | null;
    }) => {
      // Get the highest display_order
      const maxOrder = resources.reduce(
        (max, r) => Math.max(max, r.display_order || 0),
        0
      );

      let storagePath: string | null = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = `resources/${topicId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("topic-content")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        storagePath = filePath;
      }

      const { error } = await supabase.from("topic_resources").insert({
        topic_id: topicId,
        resource_type: type,
        title: title.trim(),
        url: url.trim() || null,
        storage_path: storagePath,
        description: description.trim() || null,
        display_order: maxOrder + 1,
      });

      if (error) {
        // Clean up uploaded file if database insert fails
        if (storagePath) {
          await supabase.storage.from("topic-content").remove([storagePath]);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      resetAddForm();
      setIsAddDialogOpen(false);
      toast.success("Resource added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add resource: " + error.message);
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      title,
      url,
      description,
    }: {
      id: string;
      type: string;
      title: string;
      url: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("topic_resources")
        .update({
          resource_type: type,
          title: title.trim(),
          url: url.trim() || null,
          description: description.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      setEditingResource(null);
      toast.success("Resource updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update resource: " + error.message);
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      // Find the resource to check if it has an uploaded file
      const resourceToDelete = resources.find((r) => r.id === id);

      // Delete the file from storage if it exists
      if (resourceToDelete?.storage_path) {
        await supabase.storage
          .from("topic-content")
          .remove([resourceToDelete.storage_path]);
      }

      const { error } = await supabase
        .from("topic_resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic"] });
      setDeleteResourceId(null);
      toast.success("Resource deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });

  const resetAddForm = () => {
    setNewType("link");
    setNewTitle("");
    setNewUrl("");
    setNewDescription("");
    setNewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 25MB.");
      e.target.value = "";
      return;
    }

    // Validate file type based on selected resource type
    const allowedTypes = ALLOWED_FILE_TYPES[newType];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type for ${newType}. Allowed: ${allowedTypes.join(", ")}`);
      e.target.value = "";
      return;
    }

    setNewFile(file);
    // Auto-fill title if empty
    if (!newTitle.trim()) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddResource = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!newUrl.trim() && !newFile) {
      toast.error("Please provide a URL or upload a file");
      return;
    }
    addResourceMutation.mutate({
      type: newType,
      title: newTitle,
      url: newUrl,
      description: newDescription,
      file: newFile,
    });
  };

  const getFileUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from("topic-content")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleEditClick = (resource: TopicResource) => {
    setEditingResource(resource);
    setEditType(resource.resource_type);
    setEditTitle(resource.title);
    setEditUrl(resource.url || "");
    setEditDescription(resource.description || "");
  };

  const handleUpdateResource = () => {
    if (!editingResource || !editTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    updateResourceMutation.mutate({
      id: editingResource.id,
      type: editType,
      title: editTitle,
      url: editUrl,
      description: editDescription,
    });
  };

  const getResourceIcon = (type: string) => {
    const config = RESOURCE_TYPES.find((t) => t.value === type);
    if (!config) return LinkIcon;
    return config.icon;
  };

  const getResourceColor = (type: string) => {
    const config = RESOURCE_TYPES.find((t) => t.value === type);
    return config?.color || "text-muted-foreground";
  };

  const sortedResources = [...resources].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Resources</h3>
          <Badge variant="secondary">{resources.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Resource List */}
      {sortedResources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No resources yet</p>
          <p className="text-sm">Add videos, articles, and links for this topic</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedResources.map((resource) => {
            const Icon = getResourceIcon(resource.resource_type);
            return (
              <Card
                key={resource.id}
                className="p-3 flex items-center gap-3 group hover:bg-secondary/30 transition-colors"
              >
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center bg-secondary shrink-0"
                  )}
                >
                  <Icon className={cn("w-4 h-4", getResourceColor(resource.resource_type))} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm truncate">
                      {resource.title}
                    </span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {resource.resource_type}
                    </Badge>
                    {resource.storage_path && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Upload className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  {resource.storage_path ? (
                    <a
                      href={getFileUrl(resource.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download file
                    </a>
                  ) : resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                    >
                      {resource.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditClick(resource)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteResourceId(resource.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type</Label>
              <Select value={newType} onValueChange={(value) => {
                setNewType(value);
                setNewFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={cn("w-4 h-4", type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Resource title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            {/* File Upload Section */}
            {["pdf", "image", "video", "article"].includes(newType) && (
              <div className="space-y-2">
                <Label>Upload File (max 25MB)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept={ALLOWED_FILE_TYPES[newType]?.join(",")}
                  className="hidden"
                />
                {newFile ? (
                  <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-secondary/30">
                    <File className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{newFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(newFile.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        setNewFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload a file</span>
                    </div>
                  </Button>
                )}
              </div>
            )}

            <div>
              <Label>{newFile ? "URL (optional - will use uploaded file)" : "URL"}</Label>
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddResource} disabled={addResourceMutation.isPending}>
                {addResourceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Resource
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={cn("w-4 h-4", type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingResource(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateResource} disabled={updateResourceMutation.isPending}>
                {updateResourceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteResourceId} onOpenChange={() => setDeleteResourceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResourceId && deleteResourceMutation.mutate(deleteResourceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
