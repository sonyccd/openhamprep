import { useMemo } from "react";
import { Pencil } from "lucide-react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { Question } from "./types";

const ANSWER_LETTERS = ["A", "B", "C", "D"] as const;

interface QuestionReviewTableProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  highlightQuestionId?: string;
}

export function QuestionReviewTable({
  questions,
  onEdit,
  highlightQuestionId,
}: QuestionReviewTableProps) {
  const columns = useMemo<GridColDef<Question>[]>(
    () => [
      {
        field: "display_name",
        headerName: "ID",
        width: 110,
        // Names each row for assistive tech instead of it reading as a bare
        // list of cells.
        rowHeader: true,
      },
      { field: "question", headerName: "Question", flex: 2, minWidth: 240 },
      {
        field: "answer",
        headerName: "Answer",
        flex: 2,
        minWidth: 200,
        // Derived from two fields, so it needs its own value for sorting and
        // filtering to work on the text the user actually sees.
        valueGetter: (_value, row) =>
          `${ANSWER_LETTERS[row.correct_answer] ?? "?"}. ${
            row.options[row.correct_answer] ?? "(missing)"
          }`,
      },
      {
        field: "explanation",
        headerName: "Explanation",
        flex: 2,
        minWidth: 240,
        valueGetter: (value) => value || "—",
      },
      {
        field: "actions",
        headerName: "Edit",
        width: 72,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <IconButton
            size="small"
            aria-label={`Edit ${row.display_name}`}
            onClick={() => onEdit(row)}
          >
            {/* lucide stays: adopting @mui/icons-material is deferred to C7 per
                strategy §10, and MUI components take any icon as a child. */}
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
        ),
      },
    ],
    [onEdit],
  );

  // A deep-linked question is expressed as the selected row rather than a
  // background colour: DataGrid then owns both the highlight and the
  // aria-selected state, so this needs no custom class and no style override.
  const selection = useMemo(
    () => questions.filter((q) => q.display_name === highlightQuestionId).map((q) => q.id),
    [questions, highlightQuestionId],
  );

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <DataGrid
        rows={questions}
        columns={columns}
        getRowId={(row) => row.id}
        rowSelectionModel={{ type: "include", ids: new Set(selection) }}
        disableRowSelectionOnClick
        density="compact"
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        sx={{ border: 0 }}
      />
    </Box>
  );
}
