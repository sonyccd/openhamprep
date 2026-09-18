import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { OptionIcon } from "./FeedbackOptions";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, REPORT_COPY, REPORT_ICONS } from "./helpForumUrl";
import type { ReportKind } from "./helpForumUrl";

interface ForumReportFormProps {
  kind: ReportKind;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

/** Title and description for a bug report or a piece of feedback, sent on to the forum. */
export function ForumReportForm({
  kind,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onBack,
  onSubmit,
}: ForumReportFormProps) {
  const copy = REPORT_COPY[kind];
  const ready = title.trim() !== "" && description.trim() !== "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Button
        variant="text"
        color="inherit"
        size="small"
        onClick={onBack}
        startIcon={<Box component={ArrowLeft} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        sx={{ alignSelf: "flex-start", color: "text.secondary", "&:hover": { color: "text.primary" } }}
      >
        Back to options
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <OptionIcon {...REPORT_ICONS[kind]} size={32} />
        <Typography component="h3" sx={{ fontWeight: 500 }}>
          {copy.heading}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <TextField
          id={`${kind}-title`}
          label="Title"
          placeholder={copy.titlePlaceholder}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: MAX_TITLE_LENGTH } }}
        />
        <TextField
          id={`${kind}-description`}
          label="Description"
          placeholder={copy.descriptionPlaceholder}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          multiline
          rows={4}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
        />
        <Button
          variant="contained"
          color={kind === "bug" ? "error" : "primary"}
          onClick={onSubmit}
          disabled={!ready}
          fullWidth
          endIcon={<Box component={ExternalLink} aria-hidden="true" sx={{ width: 16, height: 16 }} />}
        >
          Submit to Forum
        </Button>
      </Box>
    </Box>
  );
}
