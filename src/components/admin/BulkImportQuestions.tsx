import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { AlertTriangle, FileText, GitMerge, Upload } from "lucide-react";
import { downloadFile } from "@/lib/downloadFile";
import {
  TEST_TYPE_PREFIXES,
  mergeQuestion,
  type ImportQuestion,
  type TestType,
} from "@/lib/questionImportParser";
import { BulkImportDialog } from "./bulkImport/BulkImportDialog";
import { ConflictResolutionDialog } from "./bulkImport/ConflictResolutionDialog";
import { ImportFileDropzone } from "./bulkImport/ImportFileDropzone";
import { ImportFormatCard, ImportFormatRow } from "./bulkImport/ImportFormatCard";
import { ImportValidationSummary } from "./bulkImport/ImportValidationSummary";
import { ImportWarningPanel } from "./bulkImport/ImportWarningPanel";
import { QuestionImportWarnings } from "./bulkImport/QuestionImportWarnings";
import { QuestionPreview } from "./bulkImport/QuestionPreview";
import { exampleQuestionsCSV, exampleQuestionsJSON } from "./bulkImport/questionExamples";
import { useQuestionImport } from "./bulkImport/useQuestionImport";

interface BulkImportQuestionsProps {
  testType: TestType;
}

export function BulkImportQuestions({ testType }: BulkImportQuestionsProps) {
  const {
    isOpen,
    setOpen,
    fileInputRef,
    isProcessing,
    isImporting,
    validationResult,
    importProgress,
    importedCount,
    skippedCount,
    step,
    setStep,
    conflicts,
    newQuestions,
    importWarnings,
    requiresConfirmation,
    confirmed,
    setConfirmed,
    handleFileSelect,
    handleConflictsResolved,
    runImport,
  } = useQuestionImport(testType);

  const prefix = TEST_TYPE_PREFIXES[testType];
  const inConflictStep = step === "conflicts" && conflicts.length > 0;
  const blocked = isImporting || (requiresConfirmation && !confirmed);

  return (
    <BulkImportDialog
      open={isOpen}
      onOpenChange={setOpen}
      title="Bulk Import Questions"
      inConflictStep={inConflictStep}
      conflictContent={
        <>
          {requiresConfirmation && (
            <ImportWarningPanel sx={{ mb: 2 }}>
              Heads up: this file's answer keys looked 1-based (digits read as 0=A…3=D). You
              confirmed import — double-check merged answers below.
            </ImportWarningPanel>
          )}
          <ConflictResolutionDialog
            conflicts={conflicts}
            onResolve={handleConflictsResolved}
            // Back out to the review screen with all parsed data (and the
            // 1-based gate) intact — don't reset, which would force a full
            // re-upload and re-parse of large DOCX files.
            onCancel={() => setStep("upload")}
            renderExisting={(q: ImportQuestion) => <QuestionPreview question={q} />}
            renderIncoming={(q: ImportQuestion) => <QuestionPreview question={q} />}
            renderMerged={(existing, incoming) => (
              <QuestionPreview
                question={mergeQuestion(existing, incoming)}
                against={existing}
              />
            )}
            getItemLabel={(q) => q.id}
            itemType="question"
          />
        </>
      }
      actions={
        <>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {validationResult &&
            validationResult.valid.length > 0 &&
            (conflicts.length > 0 ? (
              <Button
                variant="contained"
                onClick={() => setStep("conflicts")}
                disabled={blocked}
                startIcon={<Box component={GitMerge} sx={{ width: 16, height: 16 }} />}
              >
                Resolve {conflicts.length} Conflicts
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => runImport()}
                disabled={blocked}
                startIcon={
                  isImporting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Box component={Upload} sx={{ width: 16, height: 16 }} />
                  )
                }
              >
                Import {newQuestions.length} Questions
              </Button>
            ))}
        </>
      }
    >
      <ImportFormatCard
        csvColumns="id, question, option_a, option_b, option_c, option_d, correct_answer (0-3 or A-D), subelement, question_group, explanation (optional)"
        jsonShape="Array of objects with: id, question, options (array), correct_answer (0-3), subelement, question_group, explanation (optional)"
        onDownloadCSV={() =>
          downloadFile(
            `example_questions_${testType}.csv`,
            exampleQuestionsCSV(prefix),
            "text/csv"
          )
        }
        onDownloadJSON={() =>
          downloadFile(
            `example_questions_${testType}.json`,
            JSON.stringify(exampleQuestionsJSON(prefix), null, 2),
            "application/json"
          )
        }
      >
        <ImportFormatRow
          icon={FileText}
          iconColor="primary.main"
          name="NCVEC Word Document (.docx)"
          detail="Official NCVEC question pool documents. Automatically extracts questions, FCC references, and syllabus info."
        />
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "warning.main",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Box component={AlertTriangle} aria-hidden="true" sx={{ width: 12, height: 12 }} />
          Question IDs must start with "{prefix}" for {testType} exam
        </Typography>
      </ImportFormatCard>

      <ImportFileDropzone
        accept=".csv,.json,.docx"
        prompt="Click to upload CSV, JSON, or DOCX"
        disabled={isProcessing || isImporting}
        isProcessing={isProcessing}
        onFileSelect={handleFileSelect}
        inputRef={fileInputRef}
      />

      {validationResult && (
        <ImportValidationSummary
          validCount={validationResult.valid.length}
          errors={validationResult.errors}
          errorLabel={(err) => `Row ${err.row}${err.id ? ` (${err.id})` : ""}`}
          conflictCount={conflicts.length}
          newCount={newQuestions.length}
          isImporting={isImporting}
          importProgress={importProgress}
          importedCount={importedCount}
          skippedCount={skippedCount}
        />
      )}

      <QuestionImportWarnings
        warnings={importWarnings}
        requiresConfirmation={requiresConfirmation}
        confirmed={confirmed}
        onConfirmedChange={setConfirmed}
      />
    </BulkImportDialog>
  );
}
