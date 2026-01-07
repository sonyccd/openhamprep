import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLessons, useCreateLesson } from "@/hooks/useLessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Search, Loader2, Pencil, Eye, EyeOff, Route } from "lucide-react";
import { EditHistoryEntry } from "./EditHistoryViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LessonEditor } from "./LessonEditor";

const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

export function AdminLessons() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Form state for new lesson
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLicenseTypes, setNewLicenseTypes] = useState<string[]>(["technician", "general", "extra"]);
  const [newIsPublished, setNewIsPublished] = useState(false);

  const { data: lessons = [], isLoading } = useAdminLessons();
  const createLesson = useCreateLesson();

  const resetAddForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewDescription("");
    setNewLicenseTypes(["technician", "general", "extra"]);
    setNewIsPublished(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const toggleLicenseType = (type: string, current: string[], setter: (types: string[]) => void) => {
    if (current.includes(type)) {
      setter(current.filter((t) => t !== type));
    } else {
      setter([...current, type]);
    }
  };

  const handleAddLesson = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!newSlug.trim()) {
      toast.error("Please enter a slug");
      return;
    }

    const historyEntry: EditHistoryEntry = {
      user_id: user?.id || "",
      user_email: user?.email || "Unknown",
      action: "created",
      changes: {},
      timestamp: new Date().toISOString(),
    };

    // Get the highest display_order
    const maxOrder = lessons.reduce((max, l) => Math.max(max, l.display_order || 0), 0);

    createLesson.mutate(
      {
        title: newTitle.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: newDescription.trim() || null,
        license_types: newLicenseTypes,
        is_published: newIsPublished,
        display_order: maxOrder + 1,
        thumbnail_url: null,
        edit_history: JSON.parse(JSON.stringify([historyEntry])),
      },
      {
        onSuccess: () => {
          resetAddForm();
          setIsAddDialogOpen(false);
          toast.success("Lesson created successfully");
        },
        onError: (error) => {
          toast.error("Failed to create lesson: " + error.message);
        },
      }
    );
  };

  const filteredLessons = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected lesson from fresh query data (ensures cache updates are reflected)
  const selectedLesson = selectedLessonId
    ? lessons.find((l) => l.id === selectedLessonId)
    : null;

  // If a lesson is selected, show the full editor
  if (selectedLesson) {
    return (
      <LessonEditor
        lesson={selectedLesson}
        onBack={() => setSelectedLessonId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Add Lesson Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Enter lesson title..."
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (!newSlug) {
                    setNewSlug(generateSlug(e.target.value));
                  }
                }}
              />
            </div>
            <div>
              <Label>Slug (URL-friendly)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="lesson-slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewSlug(generateSlug(newTitle))}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>License Types</Label>
              <div className="flex gap-4 mt-2">
                {LICENSE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newLicenseTypes.includes(opt.value)}
                      onCheckedChange={() =>
                        toggleLicenseType(opt.value, newLicenseTypes, setNewLicenseTypes)
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newIsPublished} onCheckedChange={setNewIsPublished} />
              <Label>Publish immediately</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLesson} disabled={createLesson.isPending}>
                {createLesson.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and List */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span>Lessons ({lessons.length})</span>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <p>No lessons match "{searchTerm}"</p>
              ) : (
                <>
                  <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No lessons yet. Create your first lesson!</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {lesson.title}
                      </h3>
                      {lesson.is_published ? (
                        <Badge variant="default" className="bg-success text-success-foreground gap-1">
                          <Eye className="w-3 h-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      /lessons/{lesson.slug}
                    </p>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {lesson.topics?.length || 0} topics
                      </Badge>
                      {lesson.license_types?.map((lt) => (
                        <Badge key={lt} variant="outline" className="text-xs capitalize">
                          {lt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
