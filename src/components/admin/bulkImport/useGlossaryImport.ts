import { useRef, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/services/queryKeys';
import {
  mergeTerm,
  parseCSV,
  parseJSON,
  validateTerms,
  type GlossaryValidationResult,
  type ImportTerm,
} from '@/lib/glossaryImportParser';
import type { ConflictItem, ImportStep } from './importTypes';

const BATCH_SIZE = 10;

/**
 * Everything BulkImportGlossary does that is not markup: parse, validate,
 * detect conflicts against the existing terms, and write the resolved set.
 *
 * Lives in a hook because the component was 630 lines with the mutation logic
 * inlined, against the repo's rule that mutations belong in hooks.
 */
export function useGlossaryImport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<GlossaryValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [step, setStep] = useState<ImportStep>('upload');
  const [conflicts, setConflicts] = useState<ConflictItem<ImportTerm>[]>([]);
  const [newTerms, setNewTerms] = useState<ImportTerm[]>([]);

  const resetState = () => {
    setValidationResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    setStep('upload');
    setConflicts([]);
    setNewTerms([]);
  };

  /**
   * Clears the previous parse when the dialog *opens*, not when it closes.
   * Closing happens four ways — Cancel, Escape, the backdrop, and a finished
   * import — and only two of those run through a close handler, so a reset
   * hung off closing leaves the next open showing the last file's tallies.
   * The same leak #302 found in ContentAddDialog.
   */
  const setOpen = (open: boolean) => {
    if (open) resetState();
    setIsOpen(open);
  };

  const checkForConflicts = async (terms: ImportTerm[]) => {
    const { data: existingTerms } = await supabase.from('glossary_terms').select('*');

    if (!existingTerms || existingTerms.length === 0) {
      return { conflicts: [], newTerms: terms };
    }

    const existingMap = new Map(existingTerms.map((t) => [t.term.toLowerCase(), t]));
    const conflictList: ConflictItem<ImportTerm>[] = [];
    const newList: ImportTerm[] = [];

    for (const t of terms) {
      const existing = existingMap.get(t.term.toLowerCase());
      if (existing) {
        conflictList.push({
          id: existing.id,
          existing: {
            id: existing.id,
            term: existing.term,
            definition: existing.definition,
          },
          incoming: t,
          resolution: 'keep', // default to keep existing
        });
      } else {
        newList.push(t);
      }
    }

    return { conflicts: conflictList, newTerms: newList };
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setValidationResult(null);
    setConflicts([]);
    setNewTerms([]);

    try {
      const content = await file.text();
      let terms: ImportTerm[] = [];

      if (file.name.endsWith('.json')) {
        terms = parseJSON(content);
      } else if (file.name.endsWith('.csv')) {
        terms = parseCSV(content);
      } else {
        toast.error('Please upload a CSV or JSON file');
        return;
      }

      if (terms.length === 0) {
        toast.error('No valid terms found in file');
        return;
      }

      const result = validateTerms(terms);
      setValidationResult(result);

      if (result.valid.length === 0) {
        toast.error('No valid terms to import');
        return;
      }

      const { conflicts: conflictList, newTerms: newList } = await checkForConflicts(result.valid);
      setConflicts(conflictList);
      setNewTerms(newList);

      if (conflictList.length > 0) {
        toast.info(`Found ${conflictList.length} conflicts and ${newList.length} new terms`);
      } else if (result.errors.length > 0) {
        toast.warning(
          `Found ${result.valid.length} valid terms and ${result.errors.length} with errors`
        );
      } else {
        toast.success(`${result.valid.length} terms ready to import`);
      }
    } catch (error: unknown) {
      toast.error(
        'Failed to parse file: ' + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runImport = async (resolvedConflicts?: ConflictItem<ImportTerm>[]) => {
    const conflictsToProcess = resolvedConflicts || conflicts;

    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    const termsToInsert: ImportTerm[] = [...newTerms];
    const termsToUpdate: { id: string; term: string; definition: string }[] = [];

    for (const conflict of conflictsToProcess) {
      if (conflict.resolution === 'keep') continue;

      const resolved =
        conflict.resolution === 'merge'
          ? mergeTerm(conflict.existing, conflict.incoming)
          : conflict.incoming;

      termsToUpdate.push({
        id: conflict.id,
        term: resolved.term,
        definition: resolved.definition,
      });
    }

    const totalInserts = termsToInsert.length;
    const totalUpdates = termsToUpdate.length;
    const total = totalInserts + totalUpdates;
    let imported = 0;
    let skipped = 0;

    if (total === 0) {
      setIsImporting(false);
      toast.info('No terms to import (all conflicts set to keep existing)');
      setIsOpen(false);
      return;
    }

    for (let i = 0; i < totalInserts; i += BATCH_SIZE) {
      const batch = termsToInsert.slice(i, i + BATCH_SIZE);

      for (const t of batch) {
        try {
          const { error } = await supabase
            .from('glossary_terms')
            .insert({ term: t.term, definition: t.definition });
          if (error) skipped++;
          else imported++;
        } catch {
          skipped++;
        }
      }

      setImportProgress(Math.round(((i + batch.length) / total) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);
    }

    for (let i = 0; i < totalUpdates; i += BATCH_SIZE) {
      const batch = termsToUpdate.slice(i, i + BATCH_SIZE);

      for (const t of batch) {
        try {
          const { error } = await supabase
            .from('glossary_terms')
            .update({ term: t.term, definition: t.definition })
            .eq('id', t.id);
          if (error) skipped++;
          else imported++;
        } catch {
          skipped++;
        }
      }

      setImportProgress(Math.round(((totalInserts + i + batch.length) / total) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.glossary.adminTerms() });
    queryClient.invalidateQueries({ queryKey: queryKeys.glossary.terms() });

    setIsImporting(false);

    const keptCount = conflictsToProcess.filter((c) => c.resolution === 'keep').length;
    toast.success(
      `Imported ${imported} terms${keptCount > 0 ? `, kept ${keptCount} existing` : ''}${
        skipped > 0 ? `, ${skipped} failed` : ''
      }`
    );

    setIsOpen(false);
  };

  const handleConflictsResolved = async (resolved: ConflictItem<ImportTerm>[]) => {
    setConflicts(resolved);
    setStep('importing');
    await runImport(resolved);
  };

  return {
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
  };
}
