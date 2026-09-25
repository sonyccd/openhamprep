import { Icon } from "@/components/ohp/Icon";
import { useId, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import { ChevronDown, ChevronUp } from "lucide-react";
import { tokenAlpha } from "@/theme/muiTheme";

interface CollapsibleSectionBaseProps {
  /** The heading text. */
  title: string;
  icon?: ReactNode;
  /** A count beside the title. */
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * "plain" is a rule under the heading; "card" wraps everything in a Card.
 * `static` — always open, with a heading instead of a toggle — is only
 * offered on the plain variant: a card that cannot fold is just a Card, and
 * nothing renders that combination, so the type rules it out rather than
 * leaving its styling untested.
 */
type CollapsibleSectionProps = CollapsibleSectionBaseProps &
  ({ variant?: "plain"; static?: boolean } | { variant: "card"; static?: never });

/**
 * A disclosure: a heading that opens and closes what is under it.
 *
 * The two topic side panels each hand-rolled this twice — once as a plain
 * section for desktop and once as a Card for mobile. The mobile copies put
 * the toggle on a CardHeader <div> via Radix's asChild, which gave it
 * aria-expanded and an onClick but no role and no tab stop: keyboard users
 * could not open either panel on a phone. The toggle here is a real button
 * in both variants, with aria-controls pointing at the region it opens.
 */
export function CollapsibleSection({
  title,
  icon,
  count,
  variant = "plain",
  defaultOpen = false,
  static: isStatic = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const expanded = isStatic || open;

  const heading = (
    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon}
      {title}
      {count !== undefined && (
        <Chip color="secondary" size="small" label={count} sx={{ ml: variant === "card" ? 0 : 0.5 }} />
      )}
    </Box>
  );

  const headerSx =
    variant === "card"
      ? {
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          fontSize: "0.875rem",
          fontWeight: 600,
          textAlign: "left",
          transition: "background-color 150ms",
          "&:hover": { bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30) },
        }
      : {
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1,
          px: 0.5,
          fontSize: "0.875rem",
          fontWeight: 500,
          textAlign: "left",
          color: "text.primary",
          transition: "color 150ms",
          "&:hover": { color: "primary.main" },
        };

  const header = isStatic ? (
    <Box sx={{ ...headerSx, "&:hover": {}, borderBottom: "1px solid", borderColor: "divider", mb: 1.5, pb: 1 }}>
      {heading}
    </Box>
  ) : (
    <ButtonBase
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-controls={regionId}
      sx={{
        ...headerSx,
        ...(variant === "plain" && { mb: 1, borderBottom: "1px solid", borderColor: "divider", pb: 1.5 }),
      }}
    >
      {heading}
      <Icon icon={open ? ChevronUp : ChevronDown} size={16} />
    </ButtonBase>
  );

  const body = (
    <Collapse in={expanded} id={regionId} unmountOnExit={false}>
      {variant === "card" ? <CardContent sx={{ pt: 0 }}>{children}</CardContent> : children}
    </Collapse>
  );

  if (variant === "card") {
    return (
      <Card variant="outlined">
        {header}
        {body}
      </Card>
    );
  }
  return (
    <Box>
      {header}
      {body}
    </Box>
  );
}
