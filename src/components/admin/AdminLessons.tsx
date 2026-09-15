import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLessons, useCreateLesson } from "@/hooks/useLessons";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { Plus, Search, Route } from "lucide-react";
import { EditHistoryEntry } from "./EditHistoryViewer";
import { LessonEditor } from "./LessonEditor";
import { ContentAddDialog } from "./content/ContentAddDialog";
import { LessonList } from "./content/LessonList";
import { contentDraftError, type ContentDraft } from "./content/contentDraft";

export function AdminLessons() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useAdminLessons();
  const createLesson = useCreateLesson();

  const handleAddLesson = (draft: ContentDraft) => {
    const invalid = contentDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    // Check slug uniqueness against cached lessons
    const normalizedSlug = draft.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const existingLesson = lessons.find(l => l.slug === normalizedSlug);
    if (existingLesson) {
      toast.error("A lesson with this slug already exists");
      return;
    }
    if (!user) { toast.error('Your session has expired. Please sign in again.'); return; }

    const historyEntry: EditHistoryEntry = {
      user_id: user.id,
      user_email: user.email || "Unknown",
      action: "created",
      changes: {},
      timestamp: new Date().toISOString(),
    };

    // Get the highest display_order
    const maxOrder = lessons.reduce((max, l) => Math.max(max, l.display_order || 0), 0);

    createLesson.mutate(
      {
        title: draft.title.trim(),
        slug: normalizedSlug,
        description: draft.description.trim() || null,
        license_types: draft.licenseTypes,
        is_published: draft.isPublished,
        display_order: maxOrder + 1,
        thumbnail_url: null,
        edit_history: [historyEntry],
      },
      {
        onSuccess: () => {
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
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <ContentAddDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title="Add New Lesson"
        submitLabel="Add Lesson"
        isPending={createLesson.isPending}
        onSubmit={handleAddLesson}
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
                Lessons ({lessons.length})
              </Box>
              <Button
                variant="contained"
                onClick={() => setIsAddDialogOpen(true)}
                startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
              >
                Add Lesson
              </Button>
            </Box>
          }
          subheader={
            <TextField
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              slotProps={{
                // aria-label on TextField lands on the FormControl root, not
                // the input, so the field would have no accessible name.
                htmlInput: { "aria-label": "Search lessons" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        component={Search}
                        aria-hidden="true"
                        sx={{ width: 16, height: 16, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          }
        />
        <CardContent sx={{ flex: 1, overflowY: "auto" }}>
          {isLoading ? (
            <Box
              role="status"
              aria-label="Loading lessons"
              sx={{ display: "flex", justifyContent: "center", py: 4 }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : filteredLessons.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              {searchTerm ? (
                <Typography>No lessons match "{searchTerm}"</Typography>
              ) : (
                <>
                  <Box
                    component={Route}
                    aria-hidden="true"
                    sx={{ width: 48, height: 48, mx: "auto", mb: 2, display: "block", opacity: 0.5 }}
                  />
                  <Typography>No lessons yet. Create your first lesson!</Typography>
                </>
              )}
            </Box>
          ) : (
            <LessonList lessons={filteredLessons} onSelect={setSelectedLessonId} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
