import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useHamRadioToolCategories,
  useAdminHamRadioTools,
  useCreateHamRadioTool,
  useUpdateHamRadioTool,
  useDeleteHamRadioTool,
  HamRadioTool,
  HamRadioToolCategory,
  getToolImageUrl,
} from "@/hooks/useHamRadioTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2, Pencil, ExternalLink, Wrench } from "lucide-react";
import { EditHistoryViewer, EditHistoryEntry } from "./EditHistoryViewer";
import { HamRadioToolImageUpload } from "./HamRadioToolImageUpload";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminHamRadioTools() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state for new tool
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string>("");
  const [newIsPublished, setNewIsPublished] = useState(false);

  // Edit state
  const [editingTool, setEditingTool] = useState<HamRadioTool | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editStoragePath, setEditStoragePath] = useState<string | null>(null);

  // Queries
  const { data: tools = [], isLoading: toolsLoading } = useAdminHamRadioTools();
  const { data: categories = [], isLoading: categoriesLoading } = useHamRadioToolCategories();

  // Mutations
  const createTool = useCreateHamRadioTool();
  const updateTool = useUpdateHamRadioTool();
  const deleteTool = useDeleteHamRadioTool();

  const isLoading = toolsLoading || categoriesLoading;

  // Filter tools
  const filteredTools = tools.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryFilter || t.category?.slug === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddTool = () => {
    if (!newTitle.trim() || !newDescription.trim() || !newUrl.trim()) {
      toast.error("Please fill in title, description, and URL");
      return;
    }

    const historyEntry: EditHistoryEntry = {
      user_id: user?.id || "",
      user_email: user?.email || "Unknown",
      action: "created",
      changes: {},
      timestamp: new Date().toISOString(),
    };

    createTool.mutate(
      {
        title: newTitle.trim(),
        description: newDescription.trim(),
        url: newUrl.trim(),
        category_id: newCategoryId || null,
        is_published: newIsPublished,
        display_order: tools.length,
        image_url: null,
        storage_path: null,
        edit_history: [historyEntry],
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewDescription("");
          setNewUrl("");
          setNewCategoryId("");
          setNewIsPublished(false);
          setIsAddDialogOpen(false);
          toast.success("Tool added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add tool: " + error.message);
        },
      }
    );
  };

  const handleEditClick = (tool: HamRadioTool) => {
    setEditingTool(tool);
    setEditTitle(tool.title);
    setEditDescription(tool.description);
    setEditUrl(tool.url);
    setEditCategoryId(tool.category_id || "");
    setEditIsPublished(tool.is_published);
    setEditStoragePath(tool.storage_path);
  };

  const handleUpdateTool = () => {
    if (!editingTool || !editTitle.trim() || !editDescription.trim() || !editUrl.trim()) {
      toast.error("Please fill in title, description, and URL");
      return;
    }

    // Build changes object for edit history
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (editingTool.title !== editTitle.trim()) {
      changes.title = { from: editingTool.title, to: editTitle.trim() };
    }
    if (editingTool.description !== editDescription.trim()) {
      changes.description = { from: editingTool.description, to: editDescription.trim() };
    }
    if (editingTool.url !== editUrl.trim()) {
      changes.url = { from: editingTool.url, to: editUrl.trim() };
    }
    if (editingTool.category_id !== (editCategoryId || null)) {
      changes.category_id = { from: editingTool.category_id, to: editCategoryId || null };
    }
    if (editingTool.is_published !== editIsPublished) {
      changes.is_published = { from: editingTool.is_published, to: editIsPublished };
    }
    if (editingTool.storage_path !== editStoragePath) {
      changes.storage_path = { from: editingTool.storage_path, to: editStoragePath };
    }

    const historyEntry: EditHistoryEntry = {
      user_id: user?.id || "",
      user_email: user?.email || "Unknown",
      action: "updated",
      changes,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (editingTool.edit_history || []) as EditHistoryEntry[];

    updateTool.mutate(
      {
        id: editingTool.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        url: editUrl.trim(),
        category_id: editCategoryId || null,
        is_published: editIsPublished,
        storage_path: editStoragePath,
        edit_history: [...existingHistory, historyEntry],
      },
      {
        onSuccess: () => {
          setEditingTool(null);
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
        setEditingTool(null);
        setIsDeleteDialogOpen(false);
        toast.success("Tool deleted successfully");
      },
      onError: (error) => {
        toast.error("Failed to delete tool: " + error.message);
      },
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Edit Dialog */}
      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Two sentence description..."
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editCategoryId || "none"}
                onValueChange={(val) => setEditCategoryId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-published">Published</Label>
              <Switch
                id="edit-published"
                checked={editIsPublished}
                onCheckedChange={setEditIsPublished}
              />
            </div>

            <Separator />

            <div>
              <Label>Image</Label>
              {editingTool && (
                <HamRadioToolImageUpload
                  toolId={editingTool.id}
                  currentStoragePath={editStoragePath}
                  onUpload={(storagePath) => setEditStoragePath(storagePath)}
                  onRemove={() => setEditStoragePath(null)}
                />
              )}
            </div>

            <Separator />

            <EditHistoryViewer
              history={(editingTool?.edit_history || []) as EditHistoryEntry[]}
              entityType="tool"
            />

            <div className="flex justify-between gap-2">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Tool
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Tool</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{editingTool?.title}"? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTool}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingTool(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTool} disabled={updateTool.isPending}>
                  {updateTool.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tool Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Tool name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Two sentence description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={newCategoryId || "none"}
                onValueChange={(val) => setNewCategoryId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-published">Published</Label>
              <Switch
                id="new-published"
                checked={newIsPublished}
                onCheckedChange={setNewIsPublished}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can add an image after creating the tool.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTool} disabled={createTool.isPending}>
                {createTool.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Tool
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and List */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Tools ({tools.length})
            </span>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategoryFilter || "all"}
              onValueChange={(val) => setSelectedCategoryFilter(val === "all" ? null : val)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 h-full overflow-y-auto pb-4">
              {filteredTools.map((tool) => {
                const imageUrl = getToolImageUrl(tool);
                return (
                  <div
                    key={tool.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={tool.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Wrench className="w-6 h-6 text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{tool.title}</h4>
                        {tool.is_published ? (
                          <Badge variant="default" className="text-xs">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        )}
                        {tool.category && (
                          <Badge variant="outline" className="text-xs">
                            {tool.category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {tool.description}
                      </p>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {tool.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handleEditClick(tool)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
              {filteredTools.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tools found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
