import {
  Loader2,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  Image,
  BookOpen,
  Book,
  RefreshCw,
} from "lucide-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FigureUpload } from "../FigureUpload";
import { EditHistoryViewer } from "../EditHistoryViewer";
import { getSafeUrl } from "@/lib/utils";
import { LINK_TYPE_CONFIG, type LinkType } from "@/lib/resourceTypes";
import type { Question } from "./types";
import type { ArrlChapter } from "@/types/chapters";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const SYNC_COLOR = {
  error: "error.main",
  synced: "success.main",
} as const;

interface QuestionEditDialogProps {
  question: Question | null;
  highlightQuestionId?: string;
  editQuestion: string;
  editOptions: string[];
  editCorrectAnswer: string;
  editExplanation: string;
  editFigureUrl: string | null;
  editForumUrl: string | null;
  editChapterId: string | null;
  editPageReference: string | null;
  chapters: ArrlChapter[];
  linkedTopicNames: string[];
  isDeleteDialogOpen: boolean;
  isUpdatePending: boolean;
  onClose: () => void;
  onQuestionChange: (value: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onCorrectAnswerChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onFigureUrlChange: (url: string | null) => void;
  onForumUrlChange: (url: string | null) => void;
  onChapterIdChange: (id: string | null) => void;
  onPageReferenceChange: (value: string | null) => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
  onRetrySync?: () => void;
}

export function QuestionEditDialog({
  question,
  highlightQuestionId,
  editQuestion,
  editOptions,
  editCorrectAnswer,
  editExplanation,
  editFigureUrl,
  editForumUrl,
  editChapterId,
  editPageReference,
  chapters,
  linkedTopicNames,
  isDeleteDialogOpen,
  isUpdatePending,
  onClose,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onExplanationChange,
  onFigureUrlChange,
  onForumUrlChange,
  onChapterIdChange,
  onPageReferenceChange,
  onDeleteDialogOpenChange,
  onUpdate,
  onDelete,
  onRetrySync,
}: QuestionEditDialogProps) {
  const safeForumUrl = getSafeUrl(editForumUrl);
  const syncStatus = question?.discourse_sync_status;

  return (
    <Dialog open={!!question} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Edit Question: {question?.display_name}
        {highlightQuestionId === question?.display_name && (
          <Chip label="From Stats" size="small" color="warning" variant="outlined" />
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ py: 1 }}>
          <TextField
            label="Question Text"
            placeholder="Enter the question..."
            value={editQuestion}
            onChange={(e) => onQuestionChange(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Options</Typography>
            {OPTION_LETTERS.map((letter, index) => (
              <TextField
                key={letter}
                label={`Option ${letter}`}
                placeholder={`Option ${letter}`}
                value={editOptions[index]}
                onChange={(e) => onOptionChange(index, e.target.value)}
                fullWidth
              />
            ))}
          </Stack>

          <TextField
            select
            label="Correct Answer"
            value={editCorrectAnswer}
            onChange={(e) => onCorrectAnswerChange(e.target.value)}
            fullWidth
          >
            {OPTION_LETTERS.map((letter, index) => (
              <MenuItem key={letter} value={String(index)}>
                {letter}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Explanation (shown after answering)"
            placeholder="Explain why this is the correct answer..."
            value={editExplanation}
            onChange={(e) => onExplanationChange(e.target.value)}
            helperText="This explanation will be shown to users after they answer the question."
            multiline
            rows={4}
            fullWidth
          />

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Image className="w-4 h-4" aria-hidden="true" />
              Question Figure (Optional)
            </Typography>
            <FigureUpload
              questionId={question?.id || ""}
              currentFigureUrl={editFigureUrl}
              onUpload={(url) => onFigureUrlChange(url)}
              onRemove={() => onFigureUrlChange(null)}
            />
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinkIcon className="w-4 h-4" aria-hidden="true" />
              Learning Resources
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Links are automatically extracted from the explanation. Use markdown syntax:{" "}
              <Box
                component="code"
                sx={{ px: 0.5, py: 0.25, borderRadius: 1, bgcolor: "action.hover", fontSize: "0.75rem" }}
              >
                [Link Text](https://...)
              </Box>
            </Typography>
            {question?.links && question.links.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {question.links.map((link, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", p: 1, borderRadius: 1, border: 1, borderColor: "divider" }}
                  >
                    <Chip
                      label={link.type}
                      size="small"
                      className={`${LINK_TYPE_CONFIG[link.type as LinkType]?.bgClass ?? ""} ${
                        LINK_TYPE_CONFIG[link.type as LinkType]?.colorClass ?? ""
                      }`}
                    />
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
                    >
                      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {link.title || link.url}
                      </Box>
                      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </Link>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Discourse Forum Topic (Optional)
            </Typography>
            <TextField
              placeholder="https://forum.openhamprep.com/t/topic-slug/123"
              value={editForumUrl || ""}
              onChange={(e) => onForumUrlChange(e.target.value || null)}
              helperText="Link to the Discourse forum topic for this question. When set, explanations will sync bidirectionally."
              error={!!editForumUrl && !safeForumUrl}
              fullWidth
            />
            {safeForumUrl ? (
              <Link
                href={safeForumUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                Open in Forum <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </Link>
            ) : editForumUrl ? (
              <Typography variant="caption" color="error">
                Invalid URL format. Please enter a valid http:// or https:// URL.
              </Typography>
            ) : null}
            {question?.forum_url && onRetrySync && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", pt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Sync:{" "}
                  <Box
                    component="span"
                    sx={{ color: SYNC_COLOR[syncStatus as keyof typeof SYNC_COLOR] ?? "text.secondary" }}
                  >
                    {syncStatus ?? "unknown"}
                  </Box>
                  {question.discourse_sync_error && (
                    <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>
                      — {question.discourse_sync_error}
                    </Box>
                  )}
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={onRetrySync}
                  startIcon={<RefreshCw className="w-3 h-3" />}
                >
                  Retry
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider />

          {question && (
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Linked Topics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Topics are linked from the Topics admin section. Go to Admin &gt; Topics to
                manage topic-question links.
              </Typography>
              {linkedTopicNames.length > 0 ? (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {linkedTopicNames.map((name, index) => (
                    <Chip
                      key={index}
                      size="small"
                      icon={<BookOpen className="w-3 h-3" aria-hidden="true" />}
                      label={name}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No topics linked
                </Typography>
              )}
            </Stack>
          )}

          <Divider />

          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Book className="w-4 h-4" aria-hidden="true" />
              ARRL Textbook Reference
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                select
                label="Chapter"
                value={editChapterId || "none"}
                onChange={(e) =>
                  onChapterIdChange(e.target.value === "none" ? null : e.target.value)
                }
                fullWidth
              >
                <MenuItem value="none">No chapter</MenuItem>
                {chapters.map((chapter) => (
                  <MenuItem key={chapter.id} value={chapter.id}>
                    Ch. {chapter.chapterNumber}: {chapter.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Page Reference"
                placeholder="e.g., 45 or 45-48"
                value={editPageReference || ""}
                onChange={(e) => onPageReferenceChange(e.target.value || null)}
                fullWidth
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Reference to the ARRL textbook for users who want to study from the book.
            </Typography>
          </Stack>

          <Divider />

          <EditHistoryViewer history={question?.edit_history || []} entityType="question" />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Button
          color="error"
          onClick={() => onDeleteDialogOpenChange(true)}
          startIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete Question
        </Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onUpdate}
            disabled={isUpdatePending}
            startIcon={isUpdatePending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          >
            Save Changes
          </Button>
        </Stack>
      </DialogActions>

      {/* MUI has no AlertDialog; a small Dialog with role="alertdialog" is the
          equivalent, and keeps the confirm step a genuine focus trap. */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => onDeleteDialogOpenChange(false)}
        aria-labelledby="delete-question-title"
        role="alertdialog"
      >
        <DialogTitle id="delete-question-title">Delete Question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete question "{question?.display_name}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onDeleteDialogOpenChange(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={onDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
