import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Loader2, Pencil, Trash2, Book, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useArrlChaptersWithCounts,
  useChapterMutations,
} from "@/hooks/useArrlChapters";
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

  // Form state for new chapter
  const [newChapterNumber, setNewChapterNumber] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Form state for editing chapter
  const [editChapterNumber, setEditChapterNumber] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: chapters = [], isLoading } = useArrlChaptersWithCounts(selectedLicense);
  const { addChapter, updateChapter, deleteChapter } = useChapterMutations();

  const resetAddForm = () => {
    setNewChapterNumber("");
    setNewTitle("");
    setNewDescription("");
  };

  const handleAddChapter = () => {
    const chapterNum = parseInt(newChapterNumber, 10);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return;
    }
    if (!newTitle.trim()) {
      return;
    }

    addChapter.mutate(
      {
        licenseType: selectedLicense,
        chapterNumber: chapterNum,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        displayOrder: chapterNum,
      },
      {
        onSuccess: () => {
          resetAddForm();
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleEditClick = (chapter: ArrlChapterWithCount) => {
    setEditingChapter(chapter);
    setEditChapterNumber(chapter.chapterNumber.toString());
    setEditTitle(chapter.title);
    setEditDescription(chapter.description || "");
  };

  const handleUpdateChapter = () => {
    if (!editingChapter) return;

    const chapterNum = parseInt(editChapterNumber, 10);
    if (isNaN(chapterNum) || chapterNum < 1) {
      return;
    }
    if (!editTitle.trim()) {
      return;
    }

    updateChapter.mutate(
      {
        id: editingChapter.id,
        chapterNumber: chapterNum,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        displayOrder: chapterNum,
      },
      {
        onSuccess: () => {
          setEditingChapter(null);
        },
      }
    );
  };

  const handleDeleteChapter = (id: string) => {
    deleteChapter.mutate(id);
  };

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chapterNumber.toString().includes(searchTerm) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Add Chapter Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              Add New Chapter
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Adding chapter for:{" "}
              <Badge variant="secondary">
                {LICENSE_TABS.find((t) => t.value === selectedLicense)?.label}
              </Badge>
            </div>
            <div>
              <Label>Chapter Number</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 1"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="e.g., Welcome to Amateur Radio"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of what this chapter covers..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddChapter}
                disabled={addChapter.isPending || !newChapterNumber || !newTitle.trim()}
              >
                {addChapter.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Chapter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Chapter Dialog */}
      <Dialog open={!!editingChapter} onOpenChange={(open) => !open && setEditingChapter(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Edit Chapter
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Chapter Number</Label>
              <Input
                type="number"
                min="1"
                value={editChapterNumber}
                onChange={(e) => setEditChapterNumber(e.target.value)}
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Chapter title..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-between gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete Chapter {editingChapter?.chapterNumber}:{" "}
                      {editingChapter?.title}? Questions linked to this chapter will have their
                      chapter reference removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (editingChapter) {
                          handleDeleteChapter(editingChapter.id);
                          setEditingChapter(null);
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingChapter(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateChapter}
                  disabled={updateChapter.isPending || !editChapterNumber || !editTitle.trim()}
                >
                  {updateChapter.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              ARRL Textbook Chapters
            </span>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </Button>
          </CardTitle>

          {/* License Type Tabs */}
          <Tabs
            value={selectedLicense}
            onValueChange={(v) => setSelectedLicense(v as LicenseType)}
            className="mt-4"
          >
            <TabsList>
              {LICENSE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chapters..."
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
          ) : filteredChapters.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No chapters match your search"
                  : `No chapters defined for ${
                      LICENSE_TABS.find((t) => t.value === selectedLicense)?.label
                    } yet`}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Chapter
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 h-full overflow-y-auto pb-4">
              {filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex gap-4 items-start flex-1 min-w-0 mr-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-mono font-bold text-foreground shrink-0">
                      {chapter.chapterNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">{chapter.title}</h4>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {chapter.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {chapter.questionCount} questions
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => handleEditClick(chapter)}
                  >
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
