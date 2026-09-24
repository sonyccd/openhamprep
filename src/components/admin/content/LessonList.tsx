import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Lesson } from "@/types/lessons";

interface LessonListProps {
  lessons: Lesson[];
  onSelect: (id: string) => void;
}

/** The lesson rows. Separate from TopicList for the same reason: the badge
 *  treatment and copy differ, and unifying them would change the design. */
export function LessonList({ lessons: filteredLessons, onSelect }: LessonListProps) {
  return (
    <Stack spacing={1.5}>
      {filteredLessons.map((lesson) => (
        <Card key={lesson.id} variant="outlined">
          {/*
            CardActionArea, not the <div onClick> this replaces. The row
            was the click target but had no role and no tab stop, so the
            list was unusable from a keyboard — and the pencil beside it
            was a Button with neither a handler nor an accessible name,
            so it looked like the control and was not one. It is
            decoration now, and the row is the button.
          */}
          <CardActionArea
            onClick={() => onSelect(lesson.id)}
            aria-label={`Edit ${lesson.title}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              "&:hover": {
                bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 50),
              },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography
                  component="h3"
                  sx={{
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lesson.title}
                </Typography>
                {lesson.is_published ? (
                  <Chip
                    size="small"
                    icon={<Icon icon={Eye} size={12} />}
                    label="Published"
                    sx={{
                      bgcolor: "success.main",
                      color: "success.contrastText",
                      "& .MuiChip-icon": { color: "success.contrastText" },
                    }}
                  />
                ) : (
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<Icon icon={EyeOff} size={12} />}
                    label="Draft"
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                /lessons/{lesson.slug}
              </Typography>
              {lesson.description && (
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    mt: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lesson.description}
                </Typography>
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Chip
                  color="secondary"
                  size="small"
                  label={`${lesson.topics?.length || 0} topics`}
                  sx={{ fontSize: "0.75rem" }}
                />
                {lesson.license_types?.map((lt) => (
                  <Chip
                    key={lt}
                    size="small"
                    variant="outlined"
                    label={lt}
                    sx={{ fontSize: "0.75rem", textTransform: "capitalize" }}
                  />
                ))}
              </Box>
            </Box>
            <Icon icon={Pencil} size={16} sx={{ color: "text.secondary", flexShrink: 0 }} />
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
