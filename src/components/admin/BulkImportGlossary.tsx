import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { GitMerge, Upload } from "lucide-react";
import { downloadFile } from "@/lib/downloadFile";
import {
  EXAMPLE_GLOSSARY_CSV,
  EXAMPLE_GLOSSARY_JSON,
  mergeTerm,
  type ImportTerm,
} from "@/lib/glossaryImportParser";
import { BulkImportDialog } from "./bulkImport/BulkImportDialog";
import { ConflictResolutionDialog } from "./bulkImport/ConflictResolutionDialog";
import { ImportFileDropzone } from "./bulkImport/ImportFileDropzone";
import { ImportFormatCard } from "./bulkImport/ImportFormatCard";
import { ImportValidationSummary } from "./bulkImport/ImportValidationSummary";
import { useGlossaryImport } from "./bulkImport/useGlossaryImport";

const TermPreview = ({ term, definition, note }: ImportTerm & { note?: string }) => (
  <Box sx={{ fontSize: "0.75rem" }}>
    <Typography sx={{ fontSize: "inherit", fontWeight: 500 }}>{term}</Typography>
    <Typography
      sx={{
        fontSize: "inherit",
        color: "text.secondary",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 3,
        overflow: "hidden",
      }}
    >
      {definition}
    </Typography>
    {note && (
      <Typography sx={{ color: "success.main", fontSize: "0.625rem" }}>({note})</Typography>
    )}
  </Box>
);

export function BulkImportGlossary() {
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
    newTerms,
    handleFileSelect,
    handleConflictsResolved,
    runImport,
  } = useGlossaryImport();

  const inConflictStep = step === "conflicts" && conflicts.length > 0;

  return (
    <BulkImportDialog
      open={isOpen}
      onOpenChange={setOpen}
      title="Bulk Import Glossary Terms"
      inConflictStep={inConflictStep}
      conflictContent={
        <ConflictResolutionDialog
          conflicts={conflicts}
          onResolve={handleConflictsResolved}
          // Back out to the review screen with the parse intact. Clearing the
          // conflicts here — which is what this did — left an "Import 0 Terms"
          // button and no route back to the conflicts screen short of
          // re-uploading. The questions importer already worked this way.
          onCancel={() => setStep("upload")}
          renderExisting={(t) => <TermPreview {...t} />}
          renderIncoming={(t) => <TermPreview {...t} />}
          renderMerged={(existing, incoming) => (
            <TermPreview
              {...mergeTerm(existing, incoming)}
              note={existing.definition ? "Kept existing" : "Added from upload"}
            />
          )}
          getItemLabel={(t) => t.term}
          itemType="term"
        />
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
                disabled={isImporting}
                startIcon={<Icon icon={GitMerge} size={16} />}
              >
                Resolve {conflicts.length} Conflicts
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => runImport()}
                disabled={isImporting}
                startIcon={
                  isImporting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon icon={Upload} size={16} />
                  )
                }
              >
                Import {newTerms.length} Terms
              </Button>
            ))}
        </>
      }
    >
      <ImportFormatCard
        csvColumns="term, definition"
        jsonShape="Array of objects with: term, definition"
        onDownloadCSV={() =>
          downloadFile("example_glossary.csv", EXAMPLE_GLOSSARY_CSV, "text/csv")
        }
        onDownloadJSON={() =>
          downloadFile(
            "example_glossary.json",
            JSON.stringify(EXAMPLE_GLOSSARY_JSON, null, 2),
            "application/json"
          )
        }
      />

      <ImportFileDropzone
        accept=".csv,.json"
        prompt="Click to upload CSV or JSON"
        disabled={isProcessing || isImporting}
        isProcessing={isProcessing}
        onFileSelect={handleFileSelect}
        inputRef={fileInputRef}
      />

      {validationResult && (
        <ImportValidationSummary
          validCount={validationResult.valid.length}
          errors={validationResult.errors}
          errorLabel={(err) => `Row ${err.row}${err.term ? ` (${err.term})` : ""}`}
          conflictCount={conflicts.length}
          newCount={newTerms.length}
          isImporting={isImporting}
          importProgress={importProgress}
          importedCount={importedCount}
          skippedCount={skippedCount}
        />
      )}
    </BulkImportDialog>
  );
}
