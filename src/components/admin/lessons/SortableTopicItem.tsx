import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { LessonTopic } from "@/types/lessons";

interface SortableTopicItemProps {
  lessonTopic: LessonTopic;
  index: number;
  onRemove: () => void;
  isRemoving: boolean;
}

const icon = { width: 16, height: 16 } as const;

/**
 * One topic in the lesson's order. dnd-kit does the sorting (Tier C, kept);
 * the handle is a real button so the keyboard sensor has something to focus.
 */
export function SortableTopicItem({ lessonTopic, index, onRemove, isRemoving }: SortableTopicItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lessonTopic.id });
  const title = lessonTopic.topic?.title || "Unknown Topic";

  return (
    <Box
      ref={setNodeRef}
      component="li"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        listStyle: "none",
        ...(isDragging && { opacity: 0.5, boxShadow: 6 }),
      }}
    >
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${title}`}
        sx={{ cursor: "grab", color: "text.secondary", "&:active": { cursor: "grabbing" }, "&:hover": { color: "text.primary" } }}
      >
        <Box component={GripVertical} aria-hidden="true" sx={icon} />
      </IconButton>
      <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 500, color: "text.secondary", width: 24 }}>
        {index + 1}.
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500 }} noWrap>
          {title}
        </Typography>
        {lessonTopic.topic?.description && (
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }} noWrap>
            {lessonTopic.topic.description}
          </Typography>
        )}
      </Box>
      {!lessonTopic.topic?.is_published && <DraftChip />}
      <IconButton
        size="small"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`Remove ${title} from lesson`}
        sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
      >
        {isRemoving ? <CircularProgress size={16} color="inherit" /> : <Box component={Trash2} aria-hidden="true" sx={icon} />}
      </IconButton>
    </Box>
  );
}

/** Marks a topic that is not yet published. */
export function DraftChip() {
  return <Chip size="small" variant="outlined" label="Draft" color="warning" sx={{ flexShrink: 0 }} />;
}
