import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react";
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

interface ImportTerm {
  term: string;
  definition: string;
}

interface ValidationResult {
  valid: ImportTerm[];
  errors: { row: number; term?: string; errors: string[] }[];
}

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
      
      return terms.map((t: any) => ({
        term: t.term || '',
        definition: t.definition || '',
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setValidationResult(null);

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
      } else if (result.errors.length > 0) {
        toast.warning(`Found ${result.valid.length} valid terms and ${result.errors.length} with errors`);
      } else {
        toast.success(`${result.valid.length} terms ready to import`);
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
      
      for (const t of batch) {
        try {
          const { error } = await supabase
            .from('glossary_terms')
            .insert({
              term: t.term,
              definition: t.definition,
            });

          if (error) {
            // Check if it's a duplicate
            if (error.code === '23505') {
              skipped++;
            } else {
              skipped++;
            }
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

    queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
    queryClient.invalidateQueries({ queryKey: ['glossary-terms'] });

    setIsImporting(false);
    toast.success(`Imported ${imported} terms${skipped > 0 ? `, ${skipped} skipped` : ''}`);
    
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
          <DialogTitle>Bulk Import Glossary Terms</DialogTitle>
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
                    Columns: term, definition
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileJson className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">JSON</p>
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
              <Button
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import {validationResult.valid.length} Terms
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}