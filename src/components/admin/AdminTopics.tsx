import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Search, Loader2, Pencil, Eye, EyeOff } from "lucide-react";
import { EditHistoryEntry } from "./EditHistoryViewer";
import { Topic } from "@/hooks/useTopics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { TopicEditor } from "./TopicEditor";

const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

export function AdminTopics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Form state for new topic
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLicenseTypes, setNewLicenseTypes] = useState<string[]>(["technician", "general", "extra"]);
  const [newIsPublished, setNewIsPublished] = useState(false);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select(`
          *,
          subelements:topic_subelements(id, topic_id, subelement),
          resources:topic_resources(id)
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Topic[];
    },
  });

  const addTopic = useMutation({
    mutationFn: async ({
      title,
      slug,
      description,
      license_types,
      is_published,
    }: {
      title: string;
      slug: string;
      description: string;
      license_types: string[];
      is_published: boolean;
    }) => {
      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || "",
        user_email: user?.email || "Unknown",
        action: "created",
        changes: {},
        timestamp: new Date().toISOString(),
      };

      // Get the highest display_order
      const maxOrder = topics.reduce((max, t) => Math.max(max, t.display_order || 0), 0);

      const { error } = await supabase.from("topics").insert({
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description.trim() || null,
        license_types,
        is_published,
        display_order: maxOrder + 1,
        content_path: `articles/${slug.trim().toLowerCase().replace(/\s+/g, "-")}.md`,
        edit_history: JSON.parse(JSON.stringify([historyEntry])),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      resetAddForm();
      setIsAddDialogOpen(false);
      toast.success("Topic created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create topic: " + error.message);
    },
  });

  const resetAddForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewDescription("");
    setNewLicenseTypes(["technician", "general", "extra"]);
    setNewIsPublished(false);
  };

  const handleAddTopic = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!newSlug.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    addTopic.mutate({
      title: newTitle,
      slug: newSlug,
      description: newDescription,
      license_types: newLicenseTypes,
      is_published: newIsPublished,
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLicenseType = (type: string, current: string[], setter: (types: string[]) => void) => {
    if (current.includes(type)) {
      setter(current.filter((t) => t !== type));
    } else {
      setter([...current, type]);
    }
  };

  // If a topic is selected, show the full editor
  if (selectedTopic) {
    return (
      <TopicEditor
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Add Topic Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Enter topic title..."
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
                  placeholder="topic-slug"
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
              <Button onClick={handleAddTopic} disabled={addTopic.isPending}>
                {addTopic.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Topic
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and List */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span>Topics ({topics.length})</span>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 h-full overflow-y-auto pb-4">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{topic.title}</h4>
                      {topic.is_published ? (
                        <Badge variant="default" className="bg-success/20 text-success text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      /{topic.slug}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {topic.license_types?.map((lt) => (
                        <Badge key={lt} variant="outline" className="text-xs">
                          {lt}
                        </Badge>
                      ))}
                      {topic.resources && topic.resources.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {topic.resources.length} resources
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredTopics.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No topics found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
