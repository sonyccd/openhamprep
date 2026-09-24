import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { HelpCircle } from "lucide-react";

interface HelpTriggersProps {
  onOpen: () => void;
}

const TOOLTIP = "Help & Shortcuts (?)";

/**
 * Both triggers are always in the DOM and CSS picks one, so the right button
 * paints on first render with no flash from a JS hook resolving after mount.
 *
 * Mobile: a square icon button in the top-right, mirroring the hamburger in
 * DashboardSidebar so the two corners pair up. Desktop: a floating action
 * button, bottom-right.
 */
export function HelpTriggers({ onOpen }: HelpTriggersProps) {
  return (
    <>
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          right: 16,
          // Under the notch on phones that have one; 1rem otherwise.
          top: "max(1rem, env(safe-area-inset-top, 1rem))",
          // Above the page, below the drawer — the same layer as the hamburger.
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <Tooltip title={TOOLTIP} placement="bottom">
          <IconButton
            onClick={onOpen}
            aria-label="Open help dialog"
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 3,
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <Icon icon={HelpCircle} size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      <Tooltip title={TOOLTIP} placement="left">
        <Fab
          color="primary"
          onClick={onOpen}
          aria-label="Open help dialog"
          sx={{
            display: { xs: "none", md: "inline-flex" },
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          <Icon icon={HelpCircle} size={32} />
        </Fab>
      </Tooltip>
    </>
  );
}
