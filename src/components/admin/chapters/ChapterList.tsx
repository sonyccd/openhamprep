import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Book, FileText, Pencil, Plus } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { ArrlChapterWithCount } from "@/types/chapters";

interface ChapterListProps {
  chapters: ArrlChapterWithCount[];
  searchTerm: string;
  licenseLabel?: string;
  onEdit: (chapter: ArrlChapterWithCount) => void;
  onAdd: () => void;
}

export function ChapterList({
  chapters,
  searchTerm,
  licenseLabel,
  onEdit,
  onAdd,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Box
          component={Book}
          aria-hidden="true"
          sx={{
            width: 48,
            height: 48,
            mx: "auto",
            mb: 2,
            display: "block",
            color: (t) => tokenAlpha(t.vars.palette.text.secondary, 50),
          }}
        />
        <Typography sx={{ color: "text.secondary" }}>
          {searchTerm
            ? "No chapters match your search"
            : `No chapters defined for ${licenseLabel} yet`}
        </Typography>
        {!searchTerm && (
          <Button
            variant="outlined"
            onClick={onAdd}
            startIcon={<Box component={Plus} sx={{ width: 16, height: 16 }} />}
            sx={{ mt: 2 }}
          >
            Add First Chapter
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ height: "100%", overflowY: "auto", pb: 2 }}>
      {chapters.map((chapter) => (
        <Box
          key={chapter.id}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            p: 2,
            borderRadius: "8px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            transition: "background-color 200ms",
            "&:hover": {
              bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
            },
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flex: 1, minWidth: 0, mr: 2 }}>
            <Box
              aria-hidden="true"
              sx={{
                width: 48,
                height: 48,
                borderRadius: "8px",
                bgcolor: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {chapter.chapterNumber}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h4" sx={{ fontWeight: 600 }}>
                {chapter.title}
              </Typography>
              {chapter.description && (
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    mt: 0.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {chapter.description}
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  icon={<Box component={FileText} sx={{ width: 12, height: 12 }} />}
                  label={`${chapter.questionCount} questions`}
                  sx={{ fontSize: "0.75rem" }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton
            aria-label={`Edit ${chapter.title}`}
            onClick={() => onEdit(chapter)}
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
          >
            <Box component={Pencil} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Box>
      ))}
    </Stack>
  );
}
