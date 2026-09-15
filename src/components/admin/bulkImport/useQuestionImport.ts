import { useRef, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { queryKeys } from '@/services/queryKeys';
import {
  ONE_BASED_KEY_WARNING,
  mergeQuestion,
  parseCSV,
  parseJSON,
  validateQuestions,
  type ImportQuestion,
  type TestType,
  type ValidationResult,
} from '@/lib/questionImportParser';
import { parseNCVECDocument } from '@/lib/ncvecParser';
import { rejectImportFile } from './importFileChecks';
import type { ConflictItem, ImportStep } from './importTypes';

const BATCH_SIZE = 50;

/**
 * Parse, validate, conflict-check and upsert for the question pool importer.
 *
 * Carries the 1-based answer-key gate: when the parser suspects the file's
 * answer keys are 1-based, `requiresConfirmation` goes true and `runImport`
 * refuses until the user has ticked the confirmation, whatever call path it
 * arrives by.
 */
export function useQuestionImport(testType: TestType) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [step, setStep] = useState<ImportStep>('upload');
  const [conflicts, setConflicts] = useState<ConflictItem<ImportQuestion>[]>([]);
  const [newQuestions, setNewQuestions] = useState<ImportQuestion[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const requiresConfirmation = importWarnings.includes(ONE_BASED_KEY_WARNING);

  const resetState = () => {
    setValidationResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    setStep('upload');
    setConflicts([]);
    setNewQuestions([]);
    setImportWarnings([]);
    setConfirmed(false);
  };

  /** Resets on open rather than on close — see useGlossaryImport.setOpen. */
  const setOpen = (open: boolean) => {
    if (open) resetState();
    setIsOpen(open);
  };

  const checkForConflicts = async (questions: ImportQuestion[]) => {
    // After the UUID migration the question ID (e.g. "T1A01") lives in display_name.
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('*')
      .in(
        'display_name',
        questions.map((q) => q.id)
      );

    if (!existingQuestions || existingQuestions.length === 0) {
      return { conflicts: [], newQuestions: questions };
    }

    const existingMap = new Map(existingQuestions.map((q) => [q.display_name, q]));
    const conflictList: ConflictItem<ImportQuestion>[] = [];
    const newList: ImportQuestion[] = [];

    for (const q of questions) {
      const existing = existingMap.get(q.id);
      if (existing) {
        conflictList.push({
          id: q.id,
          existing: {
            id: existing.display_name,
            question: existing.question,
            options: existing.options as string[],
            correct_answer: existing.correct_answer,
            subelement: existing.subelement,
            question_group: existing.question_group,
            explanation: existing.explanation || undefined,
            links: (existing.links as unknown[]) || [],
          },
          incoming: q,
          resolution: 'keep', // default to keep existing
        });
      } else {
        newList.push(q);
      }
    }

    return { conflicts: conflictList, newQuestions: newList };
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const rejection = rejectImportFile(file, ['.csv', '.json', '.docx']);
    if (rejection) {
      toast.error(rejection);
      return;
    }

    const name = file.name.toLowerCase();
    setIsProcessing(true);
    setValidationResult(null);
    setConflicts([]);
    setNewQuestions([]);
    setImportWarnings([]);
    setConfirmed(false);

    try {
      let questions: ImportQuestion[] = [];
      const parseWarnings: string[] = [];

      if (name.endsWith('.docx')) {
        // parseNCVECDocument also returns the document's syllabus entries;
        // nothing imports those yet, so they are not held in state.
        const { questions: ncvecQuestions, warnings } = await parseNCVECDocument(file);
        questions = ncvecQuestions;
        parseWarnings.push(...warnings);
      } else if (name.endsWith('.json')) {
        questions = parseJSON(await file.text(), parseWarnings);
      } else {
        questions = parseCSV(await file.text(), parseWarnings);
      }

      setImportWarnings(parseWarnings);
      if (parseWarnings.length > 0) {
        toast.warning(`Parsed with ${parseWarnings.length} warning(s) — see details below`);
      }

      if (questions.length === 0) {
        toast.error('No valid questions found in file');
        return;
      }

      const result = validateQuestions(questions, testType);
      setValidationResult(result);

      if (result.valid.length === 0) {
        toast.error('No valid questions to import');
        return;
      }

      const { conflicts: conflictList, newQuestions: newList } = await checkForConflicts(
        result.valid
      );
      setConflicts(conflictList);
      setNewQuestions(newList);

      if (conflictList.length > 0) {
        toast.info(`Found ${conflictList.length} conflicts and ${newList.length} new questions`);
      } else if (result.errors.length > 0) {
        toast.warning(
          `Found ${result.valid.length} valid questions and ${result.errors.length} with errors`
        );
      } else {
        toast.success(`${result.valid.length} questions ready to import`);
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

  const runImport = async (resolvedConflicts?: ConflictItem<ImportQuestion>[]) => {
    // Defence in depth: the action buttons are already disabled until the
    // 1-based confirmation is ticked, but no call path may import a
    // suspected-1-based file without that acknowledgement.
    if (requiresConfirmation && !confirmed) return;

    const conflictsToProcess = resolvedConflicts || conflicts;

    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    const questionsToImport: ImportQuestion[] = [...newQuestions];

    for (const conflict of conflictsToProcess) {
      if (conflict.resolution === 'keep') continue;
      questionsToImport.push(
        conflict.resolution === 'merge'
          ? mergeQuestion(conflict.existing, conflict.incoming)
          : conflict.incoming
      );
    }

    const total = questionsToImport.length;
    let imported = 0;
    let skipped = 0;
    const failedQuestions: { id: string; error: string }[] = [];

    if (total === 0) {
      setIsImporting(false);
      toast.info('No questions to import (all conflicts set to keep existing)');
      setIsOpen(false);
      return;
    }

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = questionsToImport.slice(i, i + BATCH_SIZE);

      for (const q of batch) {
        try {
          // Spread the optional NCVEC fields in rather than assigning onto a
          // Record<string, unknown>: that widened type does not satisfy the
          // generated row type, so the upsert lost all of its checking.
          const { error } = await supabase.from('questions').upsert(
            {
              display_name: q.id,
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              subelement: q.subelement,
              question_group: q.question_group,
              explanation: q.explanation || null,
              // links arrives as unknown[] straight from a user's file; the
              // column is jsonb, which takes any JSON, so this is the one
              // place the shape is asserted.
              links: (q.links || []) as Json[],
              ...(q.fcc_reference ? { fcc_reference: q.fcc_reference } : {}),
              ...(q.figure_reference ? { figure_reference: q.figure_reference } : {}),
            },
            { onConflict: 'display_name' }
          );

          if (error) {
            console.error('Upsert error for question', q.id, ':', error);
            failedQuestions.push({ id: q.id, error: error.message });
            skipped++;
          } else {
            imported++;
          }
        } catch (err) {
          failedQuestions.push({
            id: q.id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
          skipped++;
        }
      }

      setImportProgress(Math.round(((i + batch.length) / total) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.questions.adminFull() });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminStats.questions() });
    queryClient.invalidateQueries({ queryKey: queryKeys.questions.root });

    setIsImporting(false);

    const keptCount = conflictsToProcess.filter((c) => c.resolution === 'keep').length;

    if (failedQuestions.length > 0) {
      const failedIds = failedQuestions
        .slice(0, 5)
        .map((f) => f.id)
        .join(', ');
      const moreCount =
        failedQuestions.length > 5 ? ` and ${failedQuestions.length - 5} more` : '';
      toast.error(`Failed to import: ${failedIds}${moreCount}. Check console for details.`);
    }

    toast.success(
      `Imported ${imported} questions${keptCount > 0 ? `, kept ${keptCount} existing` : ''}${
        skipped > 0 ? `, ${skipped} failed` : ''
      }`
    );

    setIsOpen(false);
  };

  const handleConflictsResolved = async (resolved: ConflictItem<ImportQuestion>[]) => {
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
    newQuestions,
    importWarnings,
    requiresConfirmation,
    confirmed,
    setConfirmed,
    handleFileSelect,
    handleConflictsResolved,
    runImport,
  };
}
