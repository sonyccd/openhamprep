import { Icon } from "@/components/ohp/Icon";
import { useState } from "react";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/downloadFile";

interface BulkExportProps<T> {
  data: T[];
  filename: string;
  formatCSV: (items: T[]) => string;
  formatJSON: (items: T[]) => object[];
  itemLabel: string;
}

const icon = { width: 16, height: 16 } as const;

/** Offers the current list as a CSV or JSON download. */
export function BulkExport<T>({ data, filename, formatCSV, formatJSON, itemLabel }: BulkExportProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const exportAs = (format: "CSV" | "JSON") => {
    setAnchorEl(null);
    if (data.length === 0) {
      toast.error(`No ${itemLabel} to export`);
      return;
    }
    const isCsv = format === "CSV";
    downloadFile(
      `${filename}.${isCsv ? "csv" : "json"}`,
      isCsv ? formatCSV(data) : JSON.stringify(formatJSON(data), null, 2),
      isCsv ? "text/csv" : "application/json"
    );
    toast.success(`Exported ${data.length} ${itemLabel} as ${format}`);
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchorEl !== null}
        startIcon={<Icon icon={Download} sx={icon} />}
      >
        Export
      </Button>
      <Menu
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => exportAs("CSV")}>
          <ListItemIcon sx={{ minWidth: 0, mr: 1, color: "success.main" }}>
            <Icon icon={FileSpreadsheet} sx={icon} />
          </ListItemIcon>
          Export as CSV
        </MenuItem>
        <MenuItem onClick={() => exportAs("JSON")}>
          <ListItemIcon sx={{ minWidth: 0, mr: 1, color: "info.main" }}>
            <Icon icon={FileJson} sx={icon} />
          </ListItemIcon>
          Export as JSON
        </MenuItem>
      </Menu>
    </>
  );
}

