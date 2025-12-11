import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Download, GitMerge } from "lucide-react";
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
import { ConflictResolutionDialog, ConflictItem } from "./ConflictResolutionDialog";

interface ImportTerm {
  term: string;
  definition: string;
  id?: string;
}

interface ExistingTerm extends ImportTerm {
  id: string;
  created_at?: string;
  edit_history?: unknown[];
}

interface ValidationResult {
  valid: ImportTerm[];
  errors: { row: number; term?: string; errors: string[] }[];
}

type ImportStep = 'upload' | 'conflicts' | 'importing';

export function BulkImportGlossary() {
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
  const [conflicts, setConflicts] = useState<ConflictItem<ImportTerm>[]>([]);
  const [newTerms, setNewTerms] = useState<ImportTerm[]>([]);

  const parseCSV = (content: string): ImportTerm[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const terms: ImportTerm[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 2) continue;

      const getCol = (name: string) => {
        const idx = headers.indexOf(name);
        return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, '') : '';
      };

      terms.push({
        term: getCol('term'),
        definition: getCol('definition'),
      });
    }

    return terms;
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

  const parseJSON = (content: string): ImportTerm[] => {
    try {
      const data = JSON.parse(content);
      const terms = Array.isArray(data) ? data : data.terms || data.glossary || [];
      
      return terms.map((t: Record<string, unknown>) => ({
        term: String(t.term || ''),
        definition: String(t.definition || ''),
      }));
    } catch {
      return [];
    }
  };

  const validateTerms = (terms: ImportTerm[]): ValidationResult => {
    const valid: ImportTerm[] = [];
    const errors: { row: number; term?: string; errors: string[] }[] = [];

    terms.forEach((t, index) => {
      const rowErrors: string[] = [];

      if (!t.term?.trim()) rowErrors.push('Missing term');
      if (!t.definition?.trim()) rowErrors.push('Missing definition');

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, term: t.term, errors: rowErrors });
      } else {
        valid.push({
          term: t.term.trim(),
          definition: t.definition.trim(),
        });
      }
    });

    return { valid, errors };
  };

  const checkForConflicts = async (terms: ImportTerm[]) => {
    const termNames = terms.map(t => t.term.toLowerCase());
    
    const { data: existingTerms } = await supabase
      .from('glossary_terms')
      .select('*');

    if (!existingTerms || existingTerms.length === 0) {
      return { conflicts: [], newTerms: terms };
    }

    const existingMap = new Map(existingTerms.map(t => [t.term.toLowerCase(), t]));
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      } else {
        // Check for conflicts
        const { conflicts: conflictList, newTerms: newList } = await checkForConflicts(result.valid);
        setConflicts(conflictList);
        setNewTerms(newList);

        if (conflictList.length > 0) {
          toast.info(`Found ${conflictList.length} conflicts and ${newList.length} new terms`);
        } else if (result.errors.length > 0) {
          toast.warning(`Found ${result.valid.length} valid terms and ${result.errors.length} with errors`);
        } else {
          toast.success(`${result.valid.length} terms ready to import`);
        }
      }
    } catch (error: unknown) {
      toast.error('Failed to parse file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mergeTerm = (existing: ImportTerm, incoming: ImportTerm): ImportTerm => {
    return {
      id: existing.id,
      term: incoming.term || existing.term,
      definition: existing.definition || incoming.definition, // Keep existing definition if present
    };
  };

  const handleConflictsResolved = async (resolvedConflicts: ConflictItem<ImportTerm>[]) => {
    setConflicts(resolvedConflicts);
    setStep('importing');
    await handleImport(resolvedConflicts);
  };

  const handleImport = async (resolvedConflicts?: ConflictItem<ImportTerm>[]) => {
    const conflictsToProcess = resolvedConflicts || conflicts;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setSkippedCount(0);

    // Separate new terms and terms to update
    const termsToInsert: ImportTerm[] = [...newTerms];
    const termsToUpdate: { id: string; term: string; definition: string }[] = [];
    
    // Process conflicts based on resolution
    for (const conflict of conflictsToProcess) {
      if (conflict.resolution === 'keep') {
        // Skip - keep existing
        continue;
      } else if (conflict.resolution === 'replace') {
        termsToUpdate.push({
          id: conflict.id,
          term: conflict.incoming.term,
          definition: conflict.incoming.definition,
        });
      } else if (conflict.resolution === 'merge') {
        const merged = mergeTerm(conflict.existing, conflict.incoming);
        termsToUpdate.push({
          id: conflict.id,
          term: merged.term,
          definition: merged.definition,
        });
      }
    }

    const totalInserts = termsToInsert.length;
    const totalUpdates = termsToUpdate.length;
    const total = totalInserts + totalUpdates;
    let imported = 0;
    let skipped = 0;

    if (total === 0) {
      setIsImporting(false);
      toast.info('No terms to import (all conflicts set to keep existing)');
      resetState();
      setIsOpen(false);
      return;
    }

    // Insert new terms in batches
    const batchSize = 10;
    for (let i = 0; i < totalInserts; i += batchSize) {
      const batch = termsToInsert.slice(i, i + batchSize);
      
      for (const t of batch) {
        try {
          const { error } = await supabase
            .from('glossary_terms')
            .insert({
              term: t.term,
              definition: t.definition,
            });

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

    // Update existing terms
    for (let i = 0; i < totalUpdates; i += batchSize) {
      const batch = termsToUpdate.slice(i, i + batchSize);
      
      for (const t of batch) {
        try {
          const { error } = await supabase
            .from('glossary_terms')
            .update({
              term: t.term,
              definition: t.definition,
            })
            .eq('id', t.id);

          if (error) {
            skipped++;
          } else {
            imported++;
          }
        } catch {
          skipped++;
        }
      }

      setImportProgress(Math.round(((totalInserts + i + batch.length) / total) * 100));
      setImportedCount(imported);
      setSkippedCount(skipped);
    }

    queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
    queryClient.invalidateQueries({ queryKey: ['glossary-terms'] });

    setIsImporting(false);
    
    const keptCount = conflictsToProcess.filter(c => c.resolution === 'keep').length;
    toast.success(`Imported ${imported} terms${keptCount > 0 ? `, kept ${keptCount} existing` : ''}${skipped > 0 ? `, ${skipped} failed` : ''}`);
    
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
    setNewTerms([]);
  };

  const downloadExampleCSV = () => {
    const exampleData = `term,definition
Antenna,"A device that transmits and/or receives radio waves"
Bandwidth,"The range of frequencies occupied by a signal"
Carrier,"A radio wave that can be modulated to carry information"
Decibel (dB),"A unit used to express the ratio of two power levels"
Frequency,"The number of cycles per second of a radio wave, measured in Hertz"`;
    
    const blob = new Blob([exampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example_glossary.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExampleJSON = () => {
    const exampleData = [
      {
        term: "Antenna",
        definition: "A device that transmits and/or receives radio waves"
      },
      {
        term: "Bandwidth",
        definition: "The range of frequencies occupied by a signal"
      },
      {
        term: "Carrier",
        definition: "A radio wave that can be modulated to carry information"
      },
      {
        term: "Decibel (dB)",
        definition: "A unit used to express the ratio of two power levels"
      },
      {
        term: "Frequency",
        definition: "The number of cycles per second of a radio wave, measured in Hertz"
      }
    ];
    
    const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example_glossary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTermPreview = (t: ImportTerm) => (
    <div className="text-xs space-y-1">
      <p className="font-medium">{t.term}</p>
      <p className="text-muted-foreground line-clamp-3">{t.definition}</p>
    </div>
  );

  const renderMergedTerm = (existing: ImportTerm, incoming: ImportTerm) => {
    const merged = mergeTerm(existing, incoming);
    const definitionSource = existing.definition ? 'Kept existing' : 'Added from upload';
    return (
      <div className="text-xs space-y-1">
        <p className="font-medium">{merged.term}</p>
        <p className="text-muted-foreground line-clamp-3">{merged.definition}</p>
        <p className="text-green-500 text-[10px]">({definitionSource})</p>
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
            {step === 'conflicts' ? 'Resolve Import Conflicts' : 'Bulk Import Glossary Terms'}
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
            renderExisting={renderTermPreview}
            renderIncoming={renderTermPreview}
            renderMerged={renderMergedTerm}
            getItemLabel={(t) => t.term}
            itemType="term"
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
                      Columns: term, definition
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
                      Array of objects with: term, definition
                    </p>
                  </div>
                </div>
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
                  {newTerms.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                      <Upload className="w-3 h-3 mr-1" />
                      {newTerms.length} New
                    </Badge>
                  )}
                </div>

                {validationResult.errors.length > 0 && (
                  <ScrollArea className="flex-1 max-h-48 border rounded-lg p-3">
                    <div className="space-y-2">
                      {validationResult.errors.map((err, idx) => (
                        <div key={idx} className="text-sm p-2 rounded bg-destructive/10 border border-destructive/20">
                          <div className="font-medium text-destructive">
                            Row {err.row}{err.term ? ` (${err.term})` : ''}
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
                    Import {newTerms.length} Terms
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
