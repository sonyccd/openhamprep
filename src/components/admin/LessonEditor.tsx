import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { Lesson } from "@/types/lessons";
import { EditHistoryEntry, EditHistoryViewer } from "./EditHistoryViewer";
import { LessonTopicManager } from "./LessonTopicManager";

const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

interface LessonEditorProps {
  lesson: Lesson;
  onBack: () => void;
}

export function LessonEditor({ lesson, onBack }: LessonEditorProps) {
  const { user } = useAuth();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [activeTab, setActiveTab] = useState("topics");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState(lesson.title);
  const [slug, setSlug] = useState(lesson.slug);
  const [description, setDescription] = useState(lesson.description || "");
  const [licenseTypes, setLicenseTypes] = useState<string[]>(lesson.license_types || ["technician", "general", "extra"]);
  const [isPublished, setIsPublished] = useState(lesson.is_published);
  const [displayOrder, setDisplayOrder] = useState(lesson.display_order);

  const hasChanges =
    title !== lesson.title ||
    slug !== lesson.slug ||
    description !== (lesson.description || "") ||
    JSON.stringify(licenseTypes.sort()) !== JSON.stringify((lesson.license_types || []).sort()) ||
    isPublished !== lesson.is_published ||
    displayOrder !== lesson.display_order;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const toggleLicenseType = (type: string) => {
    if (licenseTypes.includes(type)) {
      setLicenseTypes(licenseTypes.filter((t) => t !== type));
    } else {
      setLicenseTypes([...licenseTypes, type]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (title !== lesson.title) changes.title = { from: lesson.title, to: title };
    if (slug !== lesson.slug) changes.slug = { from: lesson.slug, to: slug };
    if (description !== (lesson.description || "")) changes.description = { from: lesson.description, to: description };
    if (JSON.stringify(licenseTypes.sort()) !== JSON.stringify((lesson.license_types || []).sort())) {
      changes.license_types = { from: lesson.license_types, to: licenseTypes };
    }
    if (isPublished !== lesson.is_published) changes.is_published = { from: lesson.is_published, to: isPublished };
    if (displayOrder !== lesson.display_order) changes.display_order = { from: lesson.display_order, to: displayOrder };

    const historyEntry: EditHistoryEntry = {
      user_id: user?.id || "",
      user_email: user?.email || "Unknown",
      action: "updated",
      changes,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (lesson.edit_history as EditHistoryEntry[]) || [];

    updateLesson.mutate(
      {
        id: lesson.id,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        license_types: licenseTypes,
        is_published: isPublished,
        display_order: displayOrder,
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
    const previousState = isPublished;
    const newPublished = !previousState;
    setIsPublished(newPublished);

    // Auto-save publish status
    const historyEntry: EditHistoryEntry = {
      user_id: user?.id || "",
      user_email: user?.email || "Unknown",
      action: "updated",
      changes: { is_published: { from: previousState, to: newPublished } },
      timestamp: new Date().toISOString(),
    };

    const existingHistory = (lesson.edit_history as EditHistoryEntry[]) || [];

    updateLesson.mutate(
      {
        id: lesson.id,
        is_published: newPublished,
        edit_history: [...existingHistory, historyEntry],
      },
      {
        onSuccess: () => {
          toast.success(newPublished ? "Lesson published" : "Lesson unpublished");
        },
        onError: () => {
          setIsPublished(previousState); // Proper revert to captured state
          toast.error("Failed to update publish status");
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-semibold text-foreground">{lesson.title}</h2>
            <p className="text-sm text-muted-foreground">/lessons/{lesson.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePublish}
            disabled={updateLesson.isPending}
          >
            {isPublished ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateLesson.isPending}
          >
            {updateLesson.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-4">
        <TabsList className="shrink-0">
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardContent className="pt-6">
              <LessonTopicManager
                lessonId={lesson.id}
                topics={lesson.topics || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-y-auto mt-4 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lesson title..."
                />
              </div>

              <div>
                <Label>Slug (URL-friendly)</Label>
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="lesson-slug"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSlug(generateSlug(title))}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this lesson..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* License Types */}
          <Card>
            <CardHeader>
              <CardTitle>License Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {LICENSE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={licenseTypes.includes(opt.value)}
                      onCheckedChange={() => toggleLicenseType(opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <div>
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublished
                      ? "This lesson is visible to users"
                      : "This lesson is hidden (draft)"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit History */}
          {lesson.edit_history && (lesson.edit_history as EditHistoryEntry[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Edit History</CardTitle>
              </CardHeader>
              <CardContent>
                <EditHistoryViewer history={lesson.edit_history as EditHistoryEntry[]} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
              The topics in this lesson will not be deleted, only the lesson grouping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLesson.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
