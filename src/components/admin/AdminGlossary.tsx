import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
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
import { BulkImportGlossary } from "./BulkImportGlossary";
import { BulkExport } from "./BulkExport";
import { escapeCSVField } from "@/lib/csv";
import { TermAddDialog } from "./glossary/TermAddDialog";
import { TermEditDialog } from "./glossary/TermEditDialog";
import { TermList } from "./glossary/TermList";
import { termDraftError, type GlossaryTerm, type TermDraft } from "./glossary/termDraft";
import { useGlossaryAdmin } from "./glossary/useGlossaryAdmin";

export function AdminGlossary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Edit state
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);

  const { terms, isLoading, addTerm, updateTerm, deleteTerm } = useGlossaryAdmin({
    onAdded: () => setIsAddDialogOpen(false),
    onUpdated: () => setEditingTerm(null),
    onDeleted: () => setEditingTerm(null),
  });

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTerm = (draft: TermDraft) => {
    const invalid = termDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    addTerm.mutate({ term: draft.term, definition: draft.definition });
  };

  const handleUpdateTerm = (draft: TermDraft) => {
    if (!editingTerm) return;
    const invalid = termDraftError(draft);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    updateTerm.mutate({
      id: editingTerm.id,
      term: draft.term,
      definition: draft.definition,
      originalTerm: editingTerm,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <TermEditDialog
        term={editingTerm}
        onClose={() => setEditingTerm(null)}
        isPending={updateTerm.isPending}
        onSubmit={handleUpdateTerm}
        onDelete={(id) => deleteTerm.mutate(id)}
      />

      <TermAddDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        isPending={addTerm.isPending}
        onSubmit={handleAddTerm}
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
                Glossary Terms ({terms.length})
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BulkExport
                  data={terms}
                  filename="glossary_terms"
                  itemLabel="terms"
                  formatCSV={(items) => {
                    const header = "term,definition";
                    const rows = items.map(
                      (t) => `${escapeCSVField(t.term)},${escapeCSVField(t.definition)}`
                    );
                    return [header, ...rows].join("\n");
                  }}
                  formatJSON={(items) =>
                    items.map((t) => ({ term: t.term, definition: t.definition }))
                  }
                />
                <BulkImportGlossary />
                <Button
                  variant="contained"
                  onClick={() => setIsAddDialogOpen(true)}
                  startIcon={<Icon icon={Plus} size={16} />}
                >
                  Add Term
                </Button>
              </Box>
            </Box>
          }
          subheader={
            <TextField
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              slotProps={{
                // aria-label on TextField lands on the FormControl root, not
                // the input, so the field would have no accessible name (#302).
                htmlInput: { "aria-label": "Search terms" },
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
              aria-label="Loading glossary terms"
              sx={{ display: "flex", justifyContent: "center", py: 4 }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TermList terms={filteredTerms} onEdit={setEditingTerm} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
