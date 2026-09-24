import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/services/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { EditHistoryEntry } from "./EditHistoryViewer";
import { Topic } from "@/hooks/useTopics";
import { TopicEditor } from "./TopicEditor";
import { ContentAddDialog } from "./content/ContentAddDialog";
import { TopicList } from "./content/TopicList";
import { contentDraftError, type ContentDraft } from "./content/contentDraft";

export function AdminTopics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: queryKeys.topics.admin(),
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
      if (!user) throw new Error('Not authenticated');
      const historyEntry: EditHistoryEntry = {
        user_id: user.id,
        user_email: user.email || "Unknown",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.admin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all() });
      setIsAddDialogOpen(false);
      toast.success("Topic created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create topic: " + error.message);
    },
  });

  const handleAddTopic = (draft: ContentDraft) => {
    // The submit button is disabled on the same condition; this is the guard
    // for any path that bypasses it, and it matches AdminLessons rather than
    // leaving the twins to disagree.
    const invalid = contentDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    addTopic.mutate({
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      license_types: draft.licenseTypes,
      is_published: draft.isPublished,
    });
  };

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <ContentAddDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title="Add New Topic"
        submitLabel="Add Topic"
        isPending={addTopic.isPending}
        onSubmit={handleAddTopic}
      />

      <Card
        variant="outlined"
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <CardHeader
          sx={{ flexShrink: 0 }}
          title={
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box component="span" sx={{ fontSize: "1.25rem" }}>
                Topics ({topics.length})
              </Box>
              <Button
                variant="contained"
                onClick={() => setIsAddDialogOpen(true)}
                startIcon={<Icon icon={Plus} size={16} />}
              >
                Add Topic
              </Button>
            </Box>
          }
          subheader={
            <TextField
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              slotProps={{
                // aria-label on TextField lands on the FormControl root, not
                // the input, so the field would have no accessible name.
                htmlInput: { "aria-label": "Search topics" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon={Search} size={16} sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
        />
        <CardContent sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {isLoading ? (
            <Box
              role="status"
              aria-label="Loading topics"
              sx={{ display: "flex", justifyContent: "center", py: 4 }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TopicList topics={filteredTopics} onSelect={setSelectedTopic} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
