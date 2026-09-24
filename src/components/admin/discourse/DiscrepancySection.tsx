import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

type Tint = "warning" | "error" | "muted";

/** Named after its question, so a list of them reads as more than "View Topic" ×n. */
export function TopicLink({ href, questionName }: { href: string; questionName: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View topic for ${questionName}`}
      sx={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 0.5 }}
    >
      View Topic <Icon icon={ExternalLink} size={12} />
    </Link>
  );
}

interface DiscrepancyRowProps {
  tint: Tint;
  /** Lay the children out at either end of the row. */
  split?: boolean;
  children: React.ReactNode;
}

/** One row in a list, bordered and filled by how bad it is. */
export function DiscrepancyRow({ tint, split = false, children }: DiscrepancyRowProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "8px",
        border: "1px solid",
        ...(split && { display: "flex", alignItems: "center", justifyContent: "space-between" }),
        ...(tint === "muted"
          ? { borderColor: "divider", bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) }
          : {
              borderColor: (t) => tokenAlpha(t.vars.palette[tint].main, 30),
              bgcolor: (t) => tokenAlpha(t.vars.palette[tint].main, 5),
            }),
      }}
    >
      {children}
    </Box>
  );
}

interface DiscrepancySectionProps<T> {
  icon: LucideIcon;
  tint: "warning" | "error";
  title: string;
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}

/**
 * A titled, scrolling list of one kind of problem. Takes the items themselves
 * so the count in the heading cannot disagree with the rows below it. Renders
 * nothing when there are none.
 */
export function DiscrepancySection<T>({ icon: Glyph, tint, title, items, itemKey, renderItem }: DiscrepancySectionProps<T>) {
  if (items.length === 0) return null;
  return (
    <Box>
      <Typography component="h4" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 500, mb: 1.5 }}>
        <Box component={Glyph} aria-hidden="true" sx={{ width: 16, height: 16, color: `${tint}.main` }} />
        {title} ({items.length})
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 256, overflowY: "auto" }}>
        {items.map((item) => (
          <Box key={itemKey(item)} sx={{ display: "contents" }}>
            {renderItem(item)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
