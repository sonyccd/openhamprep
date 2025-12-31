import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  FileText,
  Link as LinkIcon,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Topic, useTopicQuestions } from "@/hooks/useTopics";
import { TopicMarkdownEditor } from "./TopicMarkdownEditor";
import { TopicResourceManager } from "./TopicResourceManager";
import { TopicQuestionManager } from "./TopicQuestionManager";
import { EditHistoryViewer, EditHistoryEntry } from "./EditHistoryViewer";

interface TopicEditorProps {
  topic: Topic;
  onBack: () => void;
}

const LICENSE_OPTIONS = [
  { value: "technician", label: "Technician" },
  { value: "general", label: "General" },
  { value: "extra", label: "Extra" },
];

export function TopicEditor({ topic, onBack }: TopicEditorProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("content");

  // Settings form state
  const [title, setTitle] = useState(topic.title);
  const [slug, setSlug] = useState(topic.slug);
  const [description, setDescription] = useState(topic.description || "");
  const [licenseTypes, setLicenseTypes] = useState<string[]>(topic.license_types || []);
  const [isPublished, setIsPublished] = useState(topic.is_published);
  const [displayOrder, setDisplayOrder] = useState(topic.display_order || 0);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  // Fetch linked questions count
  const { data: linkedQuestions } = useTopicQuestions(topic.id);

  // Fetch fresh topic data with resources
  const { data: freshTopic } = useQuery({
    queryKey: ["admin-topic-detail", topic.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select(`
          *,
          subelements:topic_subelements(id, topic_id, subelement),
          resources:topic_resources(id, topic_id, resource_type, title, url, storage_path, description, display_order, created_at)
        `)
        .eq("id", topic.id)
        .single();

      if (error) throw error;
      return data as Topic;
    },
    initialData: topic,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      if (topic.title !== title.trim()) {
        changes.title = { from: topic.title, to: title.trim() };
      }
      if (topic.slug !== slug.trim()) {
        changes.slug = { from: topic.slug, to: slug.trim() };
      }
      if (topic.description !== description.trim()) {
        changes.description = { from: topic.description, to: description.trim() };
      }
      if (JSON.stringify(topic.license_types) !== JSON.stringify(licenseTypes)) {
        changes.license_types = { from: topic.license_types, to: licenseTypes };
      }
      if (topic.is_published !== isPublished) {
        changes.is_published = { from: topic.is_published, to: isPublished };
      }
      if (topic.display_order !== displayOrder) {
        changes.display_order = { from: topic.display_order, to: displayOrder };
      }

      const historyEntry: EditHistoryEntry = {
        user_id: user?.id || "",
        user_email: user?.email || "Unknown",
        action: "updated",
        changes,
        timestamp: new Date().toISOString(),
      };

      const existingHistory = (topic.edit_history as EditHistoryEntry[]) || [];

      const { error } = await supabase
        .from("topics")
        .update({
          title: title.trim(),
          slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
          description: description.trim() || null,
          license_types: licenseTypes,
          is_published: isPublished,
          display_order: displayOrder,
          content_path: `articles/${slug.trim().toLowerCase().replace(/\s+/g, "-")}.md`,
          edit_history: JSON.parse(JSON.stringify([...existingHistory, historyEntry])),
        })
        .eq("id", topic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-topic-detail", topic.id] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setHasSettingsChanges(false);
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleSettingsChange = () => {
    setHasSettingsChanges(true);
  };

  const toggleLicenseType = (type: string) => {
    if (licenseTypes.includes(type)) {
      setLicenseTypes(licenseTypes.filter((t) => t !== type));
    } else {
      setLicenseTypes([...licenseTypes, type]);
    }
    handleSettingsChange();
  };

  const generateSlug = () => {
    const newSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    setSlug(newSlug);
    handleSettingsChange();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">{freshTopic?.title || topic.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">/{freshTopic?.slug || topic.slug}</span>
              {(freshTopic?.is_published ?? topic.is_published) ? (
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 mb-4">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Questions
            {(linkedQuestions?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {linkedQuestions?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Resources
            {(freshTopic?.resources?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {freshTopic?.resources?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="flex-1 min-h-0 mt-0">
          <TopicMarkdownEditor
            topicId={topic.id}
            topicSlug={freshTopic?.slug || topic.slug}
            contentPath={freshTopic?.content_path || topic.content_path}
          />
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="flex-1 min-h-0 mt-0 overflow-y-auto">
          <TopicQuestionManager topicId={topic.id} />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="flex-1 min-h-0 mt-0 overflow-y-auto">
          <TopicResourceManager
            topicId={topic.id}
            resources={freshTopic?.resources || []}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 min-h-0 mt-0 overflow-y-auto">
          <div className="space-y-6 max-w-2xl">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    handleSettingsChange();
                  }}
                  placeholder="Topic title"
                />
              </div>
              <div>
                <Label>Slug (URL-friendly)</Label>
                <div className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      handleSettingsChange();
                    }}
                    placeholder="topic-slug"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    handleSettingsChange();
                  }}
                  placeholder="Brief description for the topic card..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Visibility */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Visibility</h3>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isPublished}
                  onCheckedChange={(checked) => {
                    setIsPublished(checked);
                    handleSettingsChange();
                  }}
                />
                <div>
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublished
                      ? "This topic is visible to all users"
                      : "This topic is only visible to admins"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* License Types */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">License Types</h3>
              <p className="text-sm text-muted-foreground">
                Select which license classes this topic applies to
              </p>
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
            </div>

            <Separator />

            {/* Display Order */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Display Order</h3>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => {
                    setDisplayOrder(parseInt(e.target.value) || 0);
                    handleSettingsChange();
                  }}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Lower numbers appear first in the topic list
                </p>
              </div>
            </div>

            <Separator />

            {/* Edit History */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Edit History</h3>
              <EditHistoryViewer
                history={(freshTopic?.edit_history as EditHistoryEntry[]) || []}
                entityType="topic"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => updateSettingsMutation.mutate()}
                disabled={!hasSettingsChanges || updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
