import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle, Download, GitMerge } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConflictResolutionDialog, ConflictItem, ResolutionAction } from "./ConflictResolutionDialog";
import {
  ImportQuestion,
  ValidationResult,
  TestType,
  TEST_TYPE_PREFIXES,
  parseCSV,
  parseJSON,
  validateQuestions,
} from "@/lib/questionImportParser";

interface BulkImportQuestionsProps {
  testType: TestType;
}

type ImportStep = 'upload' | 'conflicts' | 'importing';

export function BulkImportQuestions({ testType }: BulkImportQuestionsProps) {
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

  const prefix = TEST_TYPE_PREFIXES[testType];

  const checkForConflicts = async (questions: ImportQuestion[]) => {
    const ids = questions.map(q => q.id);
    
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('*')
      .in('id', ids);

    if (!existingQuestions || existingQuestions.length === 0) {
      return { conflicts: [], newQuestions: questions };
    }

    const existingMap = new Map(existingQuestions.map(q => [q.id, q]));
    const conflictList: ConflictItem<ImportQuestion>[] = [];
    const newList: ImportQuestion[] = [];

    for (const q of questions) {
      const existing = existingMap.get(q.id);
      if (existing) {
        conflictList.push({
          id: q.id,
          existing: {
            id: existing.id,
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setValidationResult(null);
    setConflicts([]);
    setNewQuestions([]);

    try {
      const content = await file.text();
      let questions: ImportQuestion[] = [];

      if (file.name.endsWith('.json')) {
        questions = parseJSON(content);
      } else if (file.name.endsWith('.csv')) {
        questions = parseCSV(content);
      } else {
        toast.error('Please upload a CSV or JSON file');
        return;
      }

      if (questions.length === 0) {
        toast.error('No valid questions found in file');
        return;
      }

      const result = validateQuestions(questions, testType);
      setValidationResult(result);

      if (result.valid.length === 0) {
        toast.error('No valid questions to import');
      } else {
        // Check for conflicts
        const { conflicts: conflictList, newQuestions: newList } = await checkForConflicts(result.valid);
        setConflicts(conflictList);
        setNewQuestions(newList);

        if (conflictList.length > 0) {
          toast.info(`Found ${conflictList.length} conflicts and ${newList.length} new questions`);
        } else if (result.errors.length > 0) {
          toast.warning(`Found ${result.valid.length} valid questions and ${result.errors.length} with errors`);
        } else {
          toast.success(`${result.valid.length} questions ready to import`);
        }
      }
    } catch (error: unknown) {
      toast.error('Failed to parse file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mergeQuestion = (existing: ImportQuestion, incoming: ImportQuestion): ImportQuestion => {
    return {
      id: existing.id,
      question: incoming.question || existing.question,
      options: incoming.options.every(o => o) ? incoming.options : existing.options,
      correct_answer: incoming.correct_answer,
      subelement: incoming.subelement || existing.subelement,
      question_group: incoming.question_group || existing.question_group,
      explanation: existing.explanation || incoming.explanation, // Keep existing if present
      links: (existing.links && existing.links.length > 0) ? existing.links : incoming.links, // Keep existing if present
    };
  };

  const handleConflictsResolved = async (resolvedConflicts: ConflictItem<ImportQuestion>[]) => {
    setConflicts(resolvedConflicts);
    setStep('importing');
    await handleImport(resolvedConflicts);
  };

  const handleImport = async (resolvedConflicts?: ConflictItem<ImportQuestion>[]) => {
    const conflictsToProcess = resolvedConflicts || conflicts;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    const questionsToImport: ImportQuestion[] = [...newQuestions];
    
    // Process conflicts based on resolution
    for (const conflict of conflictsToProcess) {
      if (conflict.resolution === 'keep') {
        // Skip - keep existing
        continue;
      } else if (conflict.resolution === 'replace') {
        questionsToImport.push(conflict.incoming);
      } else if (conflict.resolution === 'merge') {
        questionsToImport.push(mergeQuestion(conflict.existing, conflict.incoming));
      }
    }

    const total = questionsToImport.length;
    let imported = 0;
    let skipped = 0;

    if (total === 0) {
      setIsImporting(false);
      toast.info('No questions to import (all conflicts set to keep existing)');
      resetState();
      setIsOpen(false);
      return;
    }

    // Import in batches of 10
    const batchSize = 10;
    for (let i = 0; i < total; i += batchSize) {
      const batch = questionsToImport.slice(i, i + batchSize);
      
      for (const q of batch) {
        try {
          const { error } = await supabase
            .from('questions')
            .upsert({
              id: q.id,
              question: q.question,
              options: q.options,
              correct_answer: q.correct_answer,
              subelement: q.subelement,
              question_group: q.question_group,
              explanation: q.explanation || null,
              links: q.links || []
            }, { onConflict: 'id' });

          if (error) {
            skipped++;
          } else {
            imported++;
          }
        } catch {
          skipped++;
        }
      }

      setImportProgress(Math.round(((i + batch.length) / total) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);
    }

    queryClient.invalidateQueries({ queryKey: ['admin-questions-full'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats-questions'] });
    queryClient.invalidateQueries({ queryKey: ['questions'] });

    setIsImporting(false);
    
    const keptCount = conflictsToProcess.filter(c => c.resolution === 'keep').length;
    toast.success(`Imported ${imported} questions${keptCount > 0 ? `, kept ${keptCount} existing` : ''}${skipped > 0 ? `, ${skipped} failed` : ''}`);
    
    resetState();
    setIsOpen(false);
  };

  const resetState = () => {
    setValidationResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    setStep('upload');
    setConflicts([]);
    setNewQuestions([]);
  };

  const downloadExampleCSV = () => {
    const exampleData = `id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group,explanation
${prefix}1A01,"What is the purpose of the amateur radio service?","Commercial broadcasting","Emergency communications and self-training","Government communications","Military operations",B,${prefix}1,${prefix}1A,"The amateur radio service exists for emergency communications and self-training in radio communications."
${prefix}1A02,"Which agency regulates amateur radio in the United States?","FBI","FCC","FAA","EPA",B,${prefix}1,${prefix}1A,"The Federal Communications Commission (FCC) regulates amateur radio in the United States."
${prefix}1A03,"What is the minimum age requirement for an amateur radio license?","18 years old","21 years old","16 years old","No minimum age",D,${prefix}1,${prefix}1A,"There is no minimum age requirement for an amateur radio license."`;
    
    const blob = new Blob([exampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `example_questions_${testType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExampleJSON = () => {
    const exampleData = [
      {
        id: `${prefix}1A01`,
        question: "What is the purpose of the amateur radio service?",
        options: [
          "Commercial broadcasting",
          "Emergency communications and self-training",
          "Government communications",
          "Military operations"
        ],
        correct_answer: 1,
        subelement: `${prefix}1`,
        question_group: `${prefix}1A`,
        explanation: "The amateur radio service exists for emergency communications and self-training in radio communications."
      },
      {
        id: `${prefix}1A02`,
        question: "Which agency regulates amateur radio in the United States?",
        options: ["FBI", "FCC", "FAA", "EPA"],
        correct_answer: 1,
        subelement: `${prefix}1`,
        question_group: `${prefix}1A`,
        explanation: "The Federal Communications Commission (FCC) regulates amateur radio in the United States."
      },
      {
        id: `${prefix}1A03`,
        question: "What is the minimum age requirement for an amateur radio license?",
        options: ["18 years old", "21 years old", "16 years old", "No minimum age"],
        correct_answer: 3,
        subelement: `${prefix}1`,
        question_group: `${prefix}1A`,
        explanation: "There is no minimum age requirement for an amateur radio license."
      }
    ];
    
    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `example_questions_${testType}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderQuestionPreview = (q: ImportQuestion) => (
    <div className="text-xs space-y-1">
      <p className="font-medium line-clamp-2">{q.question}</p>
      <div className="text-muted-foreground">
        <p>Options: {q.options.filter(o => o).length}/4</p>
        <p>Answer: {['A', 'B', 'C', 'D'][q.correct_answer]}</p>
        <p className={q.explanation ? 'text-green-500' : 'text-amber-500'}>
          Explanation: {q.explanation ? 'Yes' : 'None'}
        </p>
        <p className={q.links && q.links.length > 0 ? 'text-green-500' : 'text-amber-500'}>
          Links: {q.links?.length || 0}
        </p>
      </div>
    </div>
  );

  const renderMergedQuestion = (existing: ImportQuestion, incoming: ImportQuestion) => {
    const merged = mergeQuestion(existing, incoming);
    return (
      <div className="text-xs space-y-1">
        <p className="font-medium line-clamp-2">{merged.question}</p>
        <div className="text-muted-foreground">
          <p>Options: {merged.options.filter(o => o).length}/4</p>
          <p>Answer: {['A', 'B', 'C', 'D'][merged.correct_answer]}</p>
          <p className={merged.explanation ? 'text-green-500' : 'text-amber-500'}>
            Explanation: {merged.explanation ? (existing.explanation ? 'Kept' : 'Added') : 'None'}
          </p>
          <p className={merged.links && merged.links.length > 0 ? 'text-green-500' : 'text-amber-500'}>
            Links: {merged.links?.length || 0} {existing.links && existing.links.length > 0 ? '(Kept)' : ''}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[90vh] overflow-hidden flex flex-col ${step === 'conflicts' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <DialogHeader>
          <DialogTitle>
            {step === 'conflicts' ? 'Resolve Import Conflicts' : 'Bulk Import Questions'}
          </DialogTitle>
        </DialogHeader>

        {step === 'conflicts' && conflicts.length > 0 ? (
          <ConflictResolutionDialog
            conflicts={conflicts}
            onResolve={handleConflictsResolved}
            onCancel={() => {
              setStep('upload');
              setConflicts([]);
            }}
            renderExisting={renderQuestionPreview}
            renderIncoming={renderQuestionPreview}
            renderMerged={renderMergedQuestion}
            getItemLabel={(q) => q.id}
            itemType="question"
          />
        ) : (
          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            {/* File Format Info */}
            <Card className="bg-secondary/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Supported Formats</CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="w-4 h-4 mt-0.5 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">CSV</p>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={downloadExampleCSV}>
                        <Download className="w-3 h-3 mr-1" />
                        Example
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Columns: id, question, option_a, option_b, option_c, option_d, correct_answer (0-3 or A-D), subelement, question_group, explanation (optional)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileJson className="w-4 h-4 mt-0.5 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">JSON</p>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={downloadExampleJSON}>
                        <Download className="w-3 h-3 mr-1" />
                        Example
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Array of objects with: id, question, options (array), correct_answer (0-3), subelement, question_group, explanation (optional)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Question IDs must start with "{prefix}" for {testType} exam
                </p>
              </CardContent>
            </Card>

            {/* File Upload */}
            <div>
              <Label>Select File</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing || isImporting}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || isImporting}
                  className="w-full h-20 border-dashed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5" />
                      <span>Click to upload CSV or JSON</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {validationResult.valid.length} Valid
                  </Badge>
                  {validationResult.errors.length > 0 && (
                    <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      {validationResult.errors.length} Errors
                    </Badge>
                  )}
                  {conflicts.length > 0 && (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                      <GitMerge className="w-3 h-3 mr-1" />
                      {conflicts.length} Conflicts
                    </Badge>
                  )}
                  {newQuestions.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                      <Upload className="w-3 h-3 mr-1" />
                      {newQuestions.length} New
                    </Badge>
                  )}
                </div>

                {validationResult.errors.length > 0 && (
                  <ScrollArea className="flex-1 max-h-48 border rounded-lg p-3">
                    <div className="space-y-2">
                      {validationResult.errors.map((err, idx) => (
                        <div key={idx} className="text-sm p-2 rounded bg-destructive/10 border border-destructive/20">
                          <div className="font-medium text-destructive">
                            Row {err.row}{err.id ? ` (${err.id})` : ''}
                          </div>
                          <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                            {err.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Import Progress */}
                {isImporting && (
                  <div className="space-y-2 mt-3">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Importing... {importedCount} imported, {skippedCount} skipped
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {validationResult && validationResult.valid.length > 0 && (
                conflicts.length > 0 ? (
                  <Button onClick={() => setStep('conflicts')} disabled={isImporting}>
                    <GitMerge className="w-4 h-4 mr-2" />
                    Resolve {conflicts.length} Conflicts
                  </Button>
                ) : (
                  <Button onClick={() => handleImport()} disabled={isImporting}>
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Import {newQuestions.length} Questions
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
