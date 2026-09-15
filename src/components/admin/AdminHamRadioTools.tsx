import { useId, useState } from "react";
import {
  useHamRadioToolCategories,
  useAdminHamRadioTools,
  useCreateHamRadioTool,
  useUpdateHamRadioTool,
  useDeleteHamRadioTool,
  HamRadioTool,
} from "@/hooks/useHamRadioTools";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { Plus, Search } from "lucide-react";
import { ToolAddDialog } from "./tools/ToolAddDialog";
import { ToolEditDialog } from "./tools/ToolEditDialog";
import { ToolList } from "./tools/ToolList";
import { useToolAdmin } from "./tools/useToolAdmin";

export function AdminHamRadioTools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [editingTool, setEditingTool] = useState<HamRadioTool | null>(null);
  const categoryFilterLabelId = useId();

  // Queries
  const { data: tools = [], isLoading: toolsLoading } = useAdminHamRadioTools();
  const { data: categories = [], isLoading: categoriesLoading } = useHamRadioToolCategories();

  // Mutations
  const createTool = useCreateHamRadioTool();
  const updateTool = useUpdateHamRadioTool();
  const deleteTool = useDeleteHamRadioTool();

  const isLoading = toolsLoading || categoriesLoading;

  // Filter tools
  const filteredTools = tools.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryFilter || t.category?.slug === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const { handleAddTool, handleUpdateTool, handleDeleteTool } = useToolAdmin({
    tools,
    editingTool,
    createTool,
    updateTool,
    deleteTool,
    onAdded: () => setIsAddDialogOpen(false),
    onSaved: () => setEditingTool(null),
    onDeleted: () => setEditingTool(null),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <ToolEditDialog
        tool={editingTool}
        onClose={() => setEditingTool(null)}
        categories={categories}
        isPending={updateTool.isPending}
        onSubmit={handleUpdateTool}
        onDelete={handleDeleteTool}
      />

      <ToolAddDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        categories={categories}
        isPending={createTool.isPending}
        onSubmit={handleAddTool}
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
                Ham Radio Tools ({tools.length})
              </Box>
              <Button
                variant="contained"
                onClick={() => setIsAddDialogOpen(true)}
                startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
              >
                Add Tool
              </Button>
            </Box>
          }
          subheader={
            <Box sx={{ display: "flex", gap: 1.5, mt: 2, alignItems: "center" }}>
              <TextField
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                slotProps={{
                  // aria-label on TextField lands on the FormControl root, not
                  // the input, so the field would have no accessible name (#302).
                  htmlInput: { "aria-label": "Search tools" },
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
              <FormControl size="small" sx={{ width: 192, flexShrink: 0 }}>
                <InputLabel id={categoryFilterLabelId}>Category</InputLabel>
                <Select
                  labelId={categoryFilterLabelId}
                  label="Category"
                  value={selectedCategoryFilter || "all"}
                  onChange={(event) =>
                    setSelectedCategoryFilter(
                      event.target.value === "all" ? null : event.target.value
                    )
                  }
                >
                  <MenuItem value="all">All categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {isLoading ? (
            <Box
              role="status"
              aria-label="Loading tools"
              sx={{ display: "flex", justifyContent: "center", py: 4 }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <ToolList tools={filteredTools} onEdit={setEditingTool} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
