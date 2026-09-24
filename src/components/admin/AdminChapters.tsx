import { Icon } from "@/components/ohp/Icon";
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

/*
 * A total map rather than an array searched with .find(), whose result is
 * string | undefined even though every LicenseType has a label. That optional
 * flowed into the add dialog's Chip, which would have rendered empty rather
 * than complaining. Record also means a new licence type fails to compile here
 * instead of silently losing its label.
 */
const LICENSE_LABELS: Record<LicenseType, string> = {
  T: "Technician",
  G: "General",
  E: "Extra",
};

const LICENSE_TABS = Object.entries(LICENSE_LABELS) as [LicenseType, string][];

export function AdminChapters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("T");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ArrlChapterWithCount | null>(null);

  const { data: chapters = [], isLoading } = useArrlChaptersWithCounts(selectedLicense);
  const { addChapter, updateChapter, deleteChapter } = useChapterMutations();

  const licenseLabel = LICENSE_LABELS[selectedLicense];

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
                <Icon icon={Book} size={20} />
                ARRL Textbook Chapters
              </Box>
              <Button
                variant="contained"
                onClick={() => setIsAddDialogOpen(true)}
                startIcon={<Icon icon={Plus} size={16} />}
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
                {LICENSE_TABS.map(([value, label]) => (
                  <Tab key={value} value={value} label={label} />
                ))}
              </Tabs>
              <TextField
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                slotProps={{
                  // aria-label on TextField lands on the FormControl root, not
                  // the input, so the field would have no accessible name.
                  htmlInput: { "aria-label": "Search chapters" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon={Search} size={16} sx={{ color: "text.secondary" }} />
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
