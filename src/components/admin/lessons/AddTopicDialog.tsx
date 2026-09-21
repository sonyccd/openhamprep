import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Plus, Search } from "lucide-react";
import type { Topic } from "@/hooks/useTopics";
import { DraftChip } from "./SortableTopicItem";

interface AddTopicDialogProps {
  open: boolean;
  onClose: () => void;
  topics: Topic[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPick: (topicId: string) => void;
  isAdding: boolean;
}

/** Picks one of the topics not yet in the lesson. */
export function AddTopicDialog({ open, onClose, topics, searchTerm, onSearchChange, onPick, isAdding }: AddTopicDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="add-topic-title"
      slotProps={{ paper: { sx: { maxHeight: "80vh" } } }}
    >
      <DialogTitle id="add-topic-title">Add Topic to Lesson</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          type="search"
          size="small"
          placeholder="Search topics..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            htmlInput: { "aria-label": "Search topics" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Box component={Search} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mt: 0.5 }}
        />

        {topics.length > 0 ? (
          <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1, overflowY: "auto", py: 1 }}>
            {topics.map((topic) => (
              <ListItem key={topic.id} disablePadding>
                <ListItemButton
                  onClick={() => onPick(topic.id)}
                  disabled={isAdding}
                  sx={{
                    gap: 1.5,
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "8px",
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "secondary.main" },
                  }}
                >
                  <ListItemText
                    primary={topic.title}
                    secondary={topic.description || undefined}
                    slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } }, secondary: { noWrap: true } }}
                  />
                  {!topic.is_published && <DraftChip />}
                  <Box component={Plus} aria-hidden="true" sx={{ width: 16, height: 16, color: "text.secondary", flexShrink: 0 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            {searchTerm ? `No topics match "${searchTerm}"` : "All topics have been added to this lesson."}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
