import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useHamRadioTools, useHamRadioToolCategories } from "@/hooks/useHamRadioTools";
import { HamRadioToolCard } from "./HamRadioToolCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Wrench } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  if (toolsError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load tools. Please try again.</p>
      </div>
    );
  }

  return (
    <PageContainer width="wide" contentClassName="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            Tools
          </h1>
          {tools && tools.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredTools.length} of {tools.length} tools
              {selectedCategory && ` in ${categories?.find(c => c.slug === selectedCategory)?.name}`}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Category filter dropdown */}
      {categories && categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <Label htmlFor="category-filter" className="text-sm text-muted-foreground whitespace-nowrap">
            Category:
          </Label>
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
          >
            <SelectTrigger id="category-filter" className="w-[200px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Tools grid */}
      {!isLoading && filteredTools && filteredTools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <HamRadioToolCard tool={tool} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredTools && filteredTools.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          {searchQuery || selectedCategory ? (
            <>
              <h3 className="text-lg font-medium text-foreground mb-2">No tools found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No tools match "${searchQuery}". Try a different search term.`
                  : "No tools in this category yet."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-foreground mb-2">No tools available</h3>
              <p className="text-muted-foreground">
                Tools will appear here once they're published.
              </p>
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
