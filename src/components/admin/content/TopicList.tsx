import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { Topic } from "@/hooks/useTopics";

interface TopicListProps {
  topics: Topic[];
  onSelect: (topic: Topic) => void;
}

/** The topic rows. Kept apart from the lesson rows: the two lists differ in
 *  copy and badge treatment, and merging them would be a visual change. */
export function TopicList({ topics: filteredTopics, onSelect }: TopicListProps) {
  return (
    <Stack spacing={1.5} sx={{ height: "100%", overflowY: "auto", pb: 2 }}>
      {filteredTopics.map((topic) => (
        <Box
          key={topic.id}
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
          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography component="h4" sx={{ fontWeight: 600 }}>
                {topic.title}
              </Typography>
              {topic.is_published ? (
                <Chip
                  size="small"
                  icon={<Icon icon={Eye} size={12} />}
                  label="Published"
                  sx={{
                    fontSize: "0.75rem",
                    color: "success.main",
                    bgcolor: (t) => tokenAlpha(t.vars.palette.success.main, 20),
                    "& .MuiChip-icon": { color: "success.main" },
                  }}
                />
              ) : (
                <Chip
                  color="secondary"
                  size="small"
                  icon={<Icon icon={EyeOff} size={12} />}
                  label="Draft"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Box>
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
              /{topic.slug}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
              {topic.license_types?.map((lt) => (
                <Chip key={lt} size="small" variant="outlined" label={lt} sx={{ fontSize: "0.75rem" }} />
              ))}
              {topic.resources && topic.resources.length > 0 && (
                <Chip
                  color="secondary"
                  size="small"
                  label={`${topic.resources.length} resources`}
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Box>
          </Box>
          <IconButton
            aria-label={`Edit ${topic.title}`}
            onClick={() => onSelect(topic)}
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
          >
            <Icon icon={Pencil} size={16} />
          </IconButton>
        </Box>
      ))}
      {filteredTopics.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
          No topics found
        </Typography>
      )}
    </Stack>
  );
}
