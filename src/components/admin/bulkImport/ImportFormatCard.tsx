import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface ImportFormatCardProps {
  /** e.g. "term, definition" */
  csvColumns: string;
  /** e.g. "Array of objects with: term, definition" */
  jsonShape: string;
  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
  /** Extra rows or notes below the two standard formats. */
  children?: ReactNode;
}

interface ImportFormatRowProps {
  icon: typeof FileJson;
  /** A palette token, e.g. "success.main". */
  iconColor: string;
  name: string;
  detail: string;
  /** Omitted for formats with no example to hand out. */
  onDownload?: () => void;
}

/** One accepted format: icon, name, what it must contain, example download. */
export function ImportFormatRow({
  icon,
  iconColor,
  name,
  detail,
  onDownload,
}: ImportFormatRowProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      <Box
        component={icon}
        aria-hidden="true"
        sx={{ width: 16, height: 16, mt: 0.25, color: iconColor }}
      />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 500 }}>{name}</Typography>
          {onDownload && (
            <Button
              variant="text"
              size="small"
              onClick={onDownload}
              startIcon={<Box component={Download} sx={{ width: 12, height: 12 }} />}
              sx={{ fontSize: "0.75rem", minHeight: 24, py: 0, px: 1 }}
            >
              {/* Named per format: two buttons both called "Example" are
                  indistinguishable to anyone not looking at the row. */}
              Example
              <Box component="span" sx={visuallyHidden}>
                {` ${name} file`}
              </Box>
            </Button>
          )}
        </Box>
        <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{detail}</Typography>
      </Box>
    </Box>
  );
}

/** What the importer accepts, with a downloadable example of each. */
export function ImportFormatCard({
  csvColumns,
  jsonShape,
  onDownloadCSV,
  onDownloadJSON,
  children,
}: ImportFormatCardProps) {
  return (
    <Card variant="outlined" sx={{ bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) }}>
      <CardHeader
        title="Supported Formats"
        slotProps={{ title: { sx: { fontSize: "0.875rem", fontWeight: 500 } } }}
        sx={{ py: 1.5 }}
      />
      <CardContent sx={{ py: 1, fontSize: "0.875rem" }}>
        <Stack spacing={1.5}>
          <ImportFormatRow
            icon={FileSpreadsheet}
            iconColor="success.main"
            name="CSV"
            detail={`Columns: ${csvColumns}`}
            onDownload={onDownloadCSV}
          />
          <ImportFormatRow
            icon={FileJson}
            iconColor="info.main"
            name="JSON"
            detail={jsonShape}
            onDownload={onDownloadJSON}
          />
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}
