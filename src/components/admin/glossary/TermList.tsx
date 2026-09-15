import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Pencil } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";
import type { GlossaryTerm } from "./termDraft";


interface TermListProps {
  terms: GlossaryTerm[];
  onEdit: (term: GlossaryTerm) => void;
}

export function TermList({ terms, onEdit }: TermListProps) {
  if (terms.length === 0) {
    return (
      <Typography sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
        No terms found
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ height: "100%", overflowY: "auto", pb: 2 }}>
      {terms.map((term) => (
        <Box
          key={term.id}
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
            "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
            <Typography component="h4" sx={{ fontWeight: 600 }}>
              {term.term}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "text.secondary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {term.definition}
            </Typography>
          </Box>
          {/*
            The old button had no accessible name at all — a bare icon with no
            aria-label, so it announced as "button" and nothing else, thirty
            times over. Naming it after the term it edits is the only way a
            screen reader user can tell them apart.
          */}
          <IconButton
            aria-label={`Edit ${term.term}`}
            onClick={() => onEdit(term)}
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
          >
            <Box component={Pencil} aria-hidden="true" sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Box>
      ))}
    </Stack>
  );
}
