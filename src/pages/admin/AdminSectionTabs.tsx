import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

interface AdminSectionTabsProps {
  /** Distinguishes this tablist's ids from the other section's. */
  id: string;
  ariaLabel: string;
  tabs: { label: string; panel: React.ReactNode }[];
}

/** A section with more than one screen in it, as a tablist over one panel. */
export function AdminSectionTabs({ id, ariaLabel, tabs }: AdminSectionTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs value={active} onChange={(_e, next: number) => setActive(next)} aria-label={ariaLabel} sx={{ mb: 2 }}>
        {tabs.map((tab, i) => (
          <Tab key={tab.label} label={tab.label} id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} />
        ))}
      </Tabs>
      <Box role="tabpanel" id={`${id}-panel-${active}`} aria-labelledby={`${id}-tab-${active}`}>
        {tabs[active].panel}
      </Box>
    </Box>
  );
}
