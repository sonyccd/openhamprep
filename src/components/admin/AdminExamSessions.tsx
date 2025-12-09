import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExamSessions, useBulkImportExamSessions, type ExamSession } from '@/hooks/useExamSessions';

interface ParsedSession {
  title: string | null;
  exam_date: string;
  sponsor: string | null;
  exam_time: string | null;
  walk_ins_allowed: boolean;
  public_contact: string | null;
  phone: string | null;
  email: string | null;
  vec: string | null;
  location_name: string | null;
  address: string | null;
  address_2: string | null;
  address_3: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
}

interface ValidationResult {
  valid: ParsedSession[];
  errors: { row: number; message: string }[];
}

export const AdminExamSessions = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const { data: existingSessions = [] } = useExamSessions();
  const importMutation = useBulkImportExamSessions();

  const parseCSV = (content: string): ParsedSession[] => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    
    const sessions: ParsedSession[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted fields
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/^"|"$/g, '') || '';
      });

      // Parse date - handle various formats
      let examDate = '';
      const dateValue = row['date'] || row['exam_date'] || '';
      if (dateValue) {
        try {
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            examDate = parsed.toISOString().split('T')[0];
          }
        } catch {
          examDate = '';
        }
      }

      // Skip rows without required fields
      if (!examDate || !row['city'] || !row['state'] || !row['zip']) {
        continue;
      }

      sessions.push({
        title: row['title'] || null,
        exam_date: examDate,
        sponsor: row['sponsor'] || null,
        exam_time: row['time'] || row['exam_time'] || null,
        walk_ins_allowed: (row['walk-ins allowed'] || row['walk_ins_allowed'] || '').toLowerCase() === 'yes',
        public_contact: row['public contact'] || row['public_contact'] || null,
        phone: row['phone'] || null,
        email: row['email'] || null,
        vec: row['vec'] || null,
        location_name: row['location'] || row['location_name'] || null,
        address: row['address'] || null,
        address_2: row['address 2'] || row['address_2'] || null,
        address_3: row['address 3'] || row['address_3'] || null,
        city: row['city'],
        state: row['state'],
        zip: row['zip'],
        latitude: null,
        longitude: null,
      });
    }

    return sessions;
  };

  const validateSessions = (sessions: ParsedSession[]): ValidationResult => {
    const valid: ParsedSession[] = [];
    const errors: { row: number; message: string }[] = [];
    const seen = new Set<string>();

    sessions.forEach((session, index) => {
      const rowNum = index + 2; // +2 for 1-indexed and header row

      if (!session.exam_date) {
        errors.push({ row: rowNum, message: 'Missing or invalid date' });
        return;
      }

      if (!session.city || !session.state || !session.zip) {
        errors.push({ row: rowNum, message: 'Missing city, state, or ZIP' });
        return;
      }

      // Deduplicate by composite key: date + city + state + address + time
      const key = `${session.exam_date}|${session.city.toLowerCase()}|${session.state.toLowerCase()}|${(session.address || '').toLowerCase()}|${(session.exam_time || '').toLowerCase()}`;
      if (seen.has(key)) {
        errors.push({ row: rowNum, message: 'Duplicate session (same date, location, and time)' });
        return;
      }
      seen.add(key);

      // Past dates are allowed - the ARRL data may include recent sessions
      // The search UI will filter to future dates for users

      valid.push(session);
    });

    return { valid, errors };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setValidationResult(null);

    try {
      const content = await selectedFile.text();
      const parsed = parseCSV(content);
      const result = validateSessions(parsed);
      setValidationResult(result);
    } catch (error) {
      console.error('Error parsing file:', error);
      setValidationResult({ valid: [], errors: [{ row: 0, message: 'Failed to parse file' }] });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = () => {
    if (!validationResult?.valid.length) return;
    importMutation.mutate(validationResult.valid, {
      onSuccess: () => {
        setFile(null);
        setValidationResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
    });
  };

  const downloadExampleCSV = () => {
    const headers = 'Title,Date,Sponsor,Time,Walk-ins allowed,Public Contact,Phone,Email,VEC,Location,Address,Address 2,Address 3,City,State,ZIP';
    const example = '"Raleigh VE Session","2025-02-15","RARS","9:00 AM","Yes","John Doe","919-555-0123","john@example.com","ARRL/VEC","Community Center","123 Main St","Room 101","","Raleigh","NC","27601"';
    
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_sessions_example.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Exam Sessions
          </CardTitle>
          <CardDescription>
            Upload a CSV file from the ARRL exam session database. This will replace all existing sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing || importMutation.isPending}
            >
              <FileText className="h-4 w-4 mr-2" />
              Select CSV File
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadExampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download Example
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Selected: {file.name}
            </div>
          )}

          {parsing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing file...
            </div>
          )}

          {validationResult && (
            <div className="space-y-4">
              {validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{validationResult.errors.length} Errors Found</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      <ul className="text-sm space-y-1">
                        {validationResult.errors.slice(0, 20).map((error, i) => (
                          <li key={i}>Row {error.row}: {error.message}</li>
                        ))}
                        {validationResult.errors.length > 20 && (
                          <li>...and {validationResult.errors.length - 20} more errors</li>
                        )}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.valid.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>{validationResult.valid.length} Valid Sessions</AlertTitle>
                  <AlertDescription>
                    Ready to import. This will replace all {existingSessions.length} existing sessions.
                  </AlertDescription>
                </Alert>
              )}

              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing sessions...
                  </div>
                  <Progress value={50} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!validationResult.valid.length || importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Import {validationResult.valid.length} Sessions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setValidationResult(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={importMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Sessions Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Sessions</CardTitle>
          <CardDescription>
            {existingSessions.length} exam sessions in database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingSessions.length === 0 ? (
            <p className="text-muted-foreground">No exam sessions uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold">{existingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(existingSessions.map((s) => s.state)).size}
                </p>
                <p className="text-sm text-muted-foreground">States</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {existingSessions.filter((s) => s.walk_ins_allowed).length}
                </p>
                <p className="text-sm text-muted-foreground">Allow Walk-ins</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {existingSessions.filter((s) => s.latitude && s.longitude).length}
                </p>
                <p className="text-sm text-muted-foreground">With Coordinates</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
