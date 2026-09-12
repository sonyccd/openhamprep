import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useHamRadioTools, useHamRadioToolCategories } from "@/hooks/useHamRadioTools";
import { HamRadioToolCard } from "./HamRadioToolCard";
import { Search, Wrench } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

// grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6, with the breakpoint keys
// lining up with Tailwind's because muiTheme pins them to Tailwind's values.
const cardGrid = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
} as const;

export function HamRadioToolsGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: tools, isLoading: toolsLoading, error: toolsError } = useHamRadioTools();
  const { data: categories, isLoading: categoriesLoading } = useHamRadioToolCategories();

  // Filter tools by search query and category
  const filteredTools = useMemo(() => {
    let result = tools || [];

    // Filter by category
    if (selectedCategory) {
      result = result.filter((t) => t.category?.slug === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.category?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tools, selectedCategory, searchQuery]);

  const isLoading = toolsLoading || categoriesLoading;
  const isFiltered = Boolean(searchQuery || selectedCategory);

  if (toolsError) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ color: "error.main" }}>Failed to load tools. Please try again.</Typography>
      </Box>
    );
  }

  return (
    <PageContainer width="wide">
      {/* space-y-6 became Stack spacing, so no Tailwind class is passed down. */}
      <Stack spacing={3}>
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box component={Wrench} aria-hidden="true" sx={{ width: 24, height: 24 }} />
              Tools
            </Typography>
            {tools && tools.length > 0 && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {filteredTools.length} of {tools.length} tools
                {selectedCategory &&
                  ` in ${categories?.find((c) => c.slug === selectedCategory)?.name}`}
              </Typography>
            )}
          </Box>

          <TextField
            size="small"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: "100%", sm: 288 } }}
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
        </MotionBox>

        {categories && categories.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/*
              labelId, not htmlFor. MUI's Select renders its control as a
              <div role="combobox">, and <label for> only associates with
              labelable elements — so htmlFor left the control with no
              accessible name at all, announcing just its current value. The
              Radix version did not have this problem because its trigger was a
              real <button>. labelId points Select at this label's id and it
              emits aria-labelledby.
            */}
            <InputLabel
              id="category-filter-label"
              sx={{ fontSize: "0.875rem", color: "text.secondary", whiteSpace: "nowrap" }}
            >
              Category:
            </InputLabel>
            <Select
              labelId="category-filter-label"
              size="small"
              value={selectedCategory ?? "all"}
              onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="all">All categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.slug}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        )}

        {isLoading && (
          <Box sx={cardGrid}>
            {[...Array(6)].map((_, i) => (
              <Stack key={i} spacing={1.5}>
                {/* data-testid carried over from the shadcn Skeleton: a placeholder has no role to query. */}
                <Skeleton
                  data-testid="skeleton"
                  variant="rectangular"
                  sx={{ aspectRatio: "16 / 9", borderRadius: 2 }}
                />
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ height: 24, width: "75%" }} />
                <Skeleton data-testid="skeleton" variant="rectangular" sx={{ height: 16, width: "100%" }} />
              </Stack>
            ))}
          </Box>
        )}

        {!isLoading && filteredTools && filteredTools.length > 0 && (
          <Box sx={cardGrid}>
            {filteredTools.map((tool, index) => (
              <MotionBox
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <HamRadioToolCard tool={tool} />
              </MotionBox>
            ))}
          </Box>
        )}

        {!isLoading && filteredTools && filteredTools.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              borderRadius: 2,
              bgcolor: (theme) => tokenAlpha(theme.vars.palette.muted, 30),
            }}
          >
            <Box
              component={Wrench}
              aria-hidden="true"
              sx={{ width: 48, height: 48, mx: "auto", mb: 2, color: "text.secondary" }}
            />
            <Typography variant="h6" component="h3" sx={{ fontWeight: 500, mb: 1 }}>
              {isFiltered ? "No tools found" : "No tools available"}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>
              {isFiltered
                ? searchQuery
                  ? `No tools match "${searchQuery}". Try a different search term.`
                  : "No tools in this category yet."
                : "Tools will appear here once they're published."}
            </Typography>
            {isFiltered && (
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </PageContainer>
  );
}
