import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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

interface ImportQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  subelement: string;
  question_group: string;
}

interface ValidationResult {
  valid: ImportQuestion[];
  errors: { row: number; id?: string; errors: string[] }[];
}

interface BulkImportQuestionsProps {
  testType: 'technician' | 'general' | 'extra';
}

const TEST_TYPE_PREFIXES = {
  technician: 'T',
  general: 'G',
  extra: 'E',
};

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

  const prefix = TEST_TYPE_PREFIXES[testType];

  const parseCSV = (content: string): ImportQuestion[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const questions: ImportQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 9) continue;

      const getCol = (name: string) => {
        const idx = headers.indexOf(name);
        return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, '') : '';
      };

      const correctAnswerRaw = getCol('correct_answer') || getCol('correct');
      let correctAnswer = 0;
      if (['a', '0'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 0;
      else if (['b', '1'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 1;
      else if (['c', '2'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 2;
      else if (['d', '3'].includes(correctAnswerRaw.toLowerCase())) correctAnswer = 3;

      questions.push({
        id: getCol('id'),
        question: getCol('question'),
        options: [
          getCol('option_a') || getCol('a'),
          getCol('option_b') || getCol('b'),
          getCol('option_c') || getCol('c'),
          getCol('option_d') || getCol('d'),
        ],
        correct_answer: correctAnswer,
        subelement: getCol('subelement'),
        question_group: getCol('question_group') || getCol('group'),
      });
    }

    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const parseJSON = (content: string): ImportQuestion[] => {
    try {
      const data = JSON.parse(content);
      const questions = Array.isArray(data) ? data : data.questions || [];
      
      return questions.map((q: any) => ({
        id: q.id || '',
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options : [
          q.option_a || q.a || '',
          q.option_b || q.b || '',
          q.option_c || q.c || '',
          q.option_d || q.d || '',
        ],
        correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 
          ['a', '0'].includes(String(q.correct_answer).toLowerCase()) ? 0 :
          ['b', '1'].includes(String(q.correct_answer).toLowerCase()) ? 1 :
          ['c', '2'].includes(String(q.correct_answer).toLowerCase()) ? 2 :
          ['d', '3'].includes(String(q.correct_answer).toLowerCase()) ? 3 : 0,
        subelement: q.subelement || '',
        question_group: q.question_group || q.group || '',
      }));
    } catch {
      return [];
    }
  };

  const validateQuestions = (questions: ImportQuestion[]): ValidationResult => {
    const valid: ImportQuestion[] = [];
    const errors: { row: number; id?: string; errors: string[] }[] = [];

    questions.forEach((q, index) => {
      const rowErrors: string[] = [];

      if (!q.id) rowErrors.push('Missing ID');
      else if (!q.id.toUpperCase().startsWith(prefix)) {
        rowErrors.push(`ID must start with "${prefix}" for ${testType} questions`);
      }

      if (!q.question) rowErrors.push('Missing question text');
      if (!q.options || q.options.length !== 4) rowErrors.push('Must have exactly 4 options');
      else if (q.options.some(o => !o?.trim())) rowErrors.push('All options must have text');

      if (q.correct_answer < 0 || q.correct_answer > 3) rowErrors.push('Invalid correct answer');
      if (!q.subelement) rowErrors.push('Missing subelement');
      if (!q.question_group) rowErrors.push('Missing question group');

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, id: q.id, errors: rowErrors });
      } else {
        valid.push({
          ...q,
          id: q.id.toUpperCase().trim(),
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          subelement: q.subelement.trim(),
          question_group: q.question_group.trim(),
        });
      }
    });

    return { valid, errors };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setValidationResult(null);

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

      const result = validateQuestions(questions);
      setValidationResult(result);

      if (result.valid.length === 0) {
        toast.error('No valid questions to import');
      } else if (result.errors.length > 0) {
        toast.warning(`Found ${result.valid.length} valid questions and ${result.errors.length} with errors`);
      } else {
        toast.success(`${result.valid.length} questions ready to import`);
      }
    } catch (error: any) {
      toast.error('Failed to parse file: ' + error.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    const total = validationResult.valid.length;
    let imported = 0;
    let skipped = 0;

    // Import in batches of 10
    const batchSize = 10;
    for (let i = 0; i < total; i += batchSize) {
      const batch = validationResult.valid.slice(i, i + batchSize);
      
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
              links: []
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
    toast.success(`Imported ${imported} questions${skipped > 0 ? `, ${skipped} skipped` : ''}`);
    
    if (skipped === 0) {
      setValidationResult(null);
      setIsOpen(false);
    }
  };

  const resetState = () => {
    setValidationResult(null);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Questions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {/* File Format Info */}
          <Card className="bg-secondary/30">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-muted-foreground text-xs">
                    Columns: id, question, option_a, option_b, option_c, option_d, correct_answer (0-3 or A-D), subelement, question_group
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileJson className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">JSON</p>
                  <p className="text-muted-foreground text-xs">
                    Array of objects with: id, question, options (array), correct_answer (0-3), subelement, question_group
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
              <div className="flex items-center gap-4 mb-3">
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
              <Button
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import {validationResult.valid.length} Questions
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}