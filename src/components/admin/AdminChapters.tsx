import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { Book, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useArrlChaptersWithCounts,
  useChapterMutations,
} from "@/hooks/useArrlChapters";
import { ChapterAddDialog } from "./chapters/ChapterAddDialog";
import { ChapterEditDialog } from "./chapters/ChapterEditDialog";
import { ChapterList } from "./chapters/ChapterList";
import type { ChapterDraft } from "./chapters/chapterDraft";
import type { ArrlChapterWithCount, LicenseType } from "@/types/chapters";

const LICENSE_TABS: { value: LicenseType; label: string }[] = [
  { value: "T", label: "Technician" },
  { value: "G", label: "General" },
  { value: "E", label: "Extra" },
];

export function AdminChapters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("T");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ArrlChapterWithCount | null>(null);

  const { data: chapters = [], isLoading } = useArrlChaptersWithCounts(selectedLicense);
  const { addChapter, updateChapter, deleteChapter } = useChapterMutations();

  const licenseLabel = LICENSE_TABS.find((t) => t.value === selectedLicense)?.label;

  /**
   * Both dialogs validate the same way, so the check lives here rather than in
   * each of them. The submit button is disabled for the same conditions; this
   * is the guard for the paths that bypass it.
   */
  const parseDraft = (draft: ChapterDraft) => {
    const chapterNumber = parseInt(draft.chapterNumber, 10);
    if (Number.isNaN(chapterNumber) || chapterNumber < 1) {
      toast.error("Please enter a valid chapter number (1 or greater)");
      return null;
    }
    if (!draft.title.trim()) {
      toast.error("Please enter a chapter title");
      return null;
    }
    return {
      chapterNumber,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      displayOrder: chapterNumber,
    };
  };

  const handleAddChapter = (draft: ChapterDraft, onSuccess: () => void) => {
    const parsed = parseDraft(draft);
    if (!parsed) return;
    addChapter.mutate({ licenseType: selectedLicense, ...parsed }, { onSuccess });
  };

  const handleUpdateChapter = (draft: ChapterDraft, onSuccess: () => void) => {
    if (!editingChapter) return;
    const parsed = parseDraft(draft);
    if (!parsed) return;
    updateChapter.mutate({ id: editingChapter.id, ...parsed }, { onSuccess });
  };

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chapterNumber.toString().includes(searchTerm) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <ChapterAddDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        licenseLabel={licenseLabel}
        isPending={addChapter.isPending}
        onSubmit={handleAddChapter}
      />

      <ChapterEditDialog
        chapter={editingChapter}
        onClose={() => setEditingChapter(null)}
        isPending={updateChapter.isPending}
        onSubmit={handleUpdateChapter}
        onDelete={(id) => deleteChapter.mutate(id)}
      />

      <Card
        variant="outlined"
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <CardHeader
          sx={{ flexShrink: 0 }}
          title={
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1.25rem" }}
              >
                <Box component={Book} aria-hidden="true" sx={{ width: 20, height: 20 }} />
                ARRL Textbook Chapters
              </Box>
              <Button
                variant="contained"
                onClick={() => setIsAddDialogOpen(true)}
                startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
              >
                Add Chapter
              </Button>
            </Box>
          }
          subheader={
            <Box sx={{ mt: 2 }}>
              <Tabs
                value={selectedLicense}
                onChange={(_event, value) => setSelectedLicense(value as LicenseType)}
                aria-label="License type"
              >
                {LICENSE_TABS.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
              <TextField
                placeholder="Search chapters..."
                aria-label="Search chapters"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                slotProps={{
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
            </Box>
          }
        />

        <CardContent sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {isLoading ? (
            <Box
              role="status"
              aria-label="Loading chapters"
              sx={{ display: "flex", justifyContent: "center", py: 4 }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <ChapterList
              chapters={filteredChapters}
              searchTerm={searchTerm}
              licenseLabel={licenseLabel}
              onEdit={setEditingChapter}
              onAdd={() => setIsAddDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
