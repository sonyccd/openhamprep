import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface BulkExportProps<T> {
  data: T[];
  filename: string;
  formatCSV: (items: T[]) => string;
  formatJSON: (items: T[]) => object[];
  itemLabel: string;
}

export function BulkExport<T>({
  data,
  filename,
  formatCSV,
  formatJSON,
  itemLabel,
}: BulkExportProps<T>) {
  const downloadFile = (content: string, extension: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error(`No ${itemLabel} to export`);
      return;
    }
    const csvContent = formatCSV(data);
    downloadFile(csvContent, 'csv', 'text/csv');
    toast.success(`Exported ${data.length} ${itemLabel} as CSV`);
  };

  const handleExportJSON = () => {
    if (data.length === 0) {
      toast.error(`No ${itemLabel} to export`);
      return;
    }
    const jsonContent = JSON.stringify(formatJSON(data), null, 2);
    downloadFile(jsonContent, 'json', 'application/json');
    toast.success(`Exported ${data.length} ${itemLabel} as JSON`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="w-4 h-4 mr-2 text-blue-500" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to escape CSV fields
export function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If the field contains comma, newline, or double quotes, wrap it in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
