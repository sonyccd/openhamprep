import { Icon } from "@/components/ohp/Icon";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { PanelLeftOpen, PanelRightClose } from "lucide-react";
import { MotionBox } from "@/components/ohp/MotionBox";
import { tokenAlpha } from "@/theme/muiTheme";

interface TopicSidebarProps {
  /** Changing this collapses the sidebar, so every topic opens at its default. */
  resetKey: string;
  /** Reported so the page can size its grid column. */
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

const focusRing = {
  "&:focus-visible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: 2,
  },
};

/**
 * The questions-and-resources aside, collapsible on desktop.
 *
 * On mobile the panels are always visible, stacked below the content; the
 * rail and Hide controls are desktop-only, so the collapse is deliberately
 * asymmetric across breakpoints.
 *
 * When the sidebar is toggled, focus moves to the control that is now
 * visible, so keyboard and screen-reader users don't lose their place when
 * the button they pressed disappears. The previous-value ref means that
 * effect fires only on a real change — never on first render, and never on
 * the collapse a topic change triggers.
 */
export function TopicSidebar({ resetKey, onOpenChange, children }: TopicSidebarProps) {
  const [open, setOpen] = useState(false);
  const railButtonRef = useRef<HTMLButtonElement>(null);
  const hideButtonRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (prevOpenRef.current === open) return;
    prevOpenRef.current = open;
    if (open) hideButtonRef.current?.focus();
    else railButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setOpen(false);
    prevOpenRef.current = false;
    onOpenChange(false);
    // onOpenChange is a setState from the parent and stable; the reset is
    // keyed on the topic alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  return (
    <MotionBox
      component="aside"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      aria-label="Questions and resources"
    >
      {!open && (
        <ButtonBase
          ref={railButtonRef}
          onClick={() => toggle(true)}
          aria-label="Show Questions & Resources"
          aria-expanded={open}
          aria-controls="topic-sidebar-panels"
          sx={{
            display: { xs: "none", lg: "flex" },
            position: "sticky",
            top: 16,
            width: 44,
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 1.5,
            borderRadius: "8px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            color: "text.secondary",
            transition: "color 150ms, background-color 150ms",
            "&:hover": {
              color: "primary.main",
              bgcolor: (t) => tokenAlpha(t.vars.palette.secondary.main, 30),
            },
            ...focusRing,
          }}
        >
          <Icon icon={PanelLeftOpen} size={16} />
          <Box
            component="span"
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.025em",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Questions &amp; Resources
          </Box>
        </ButtonBase>
      )}

      <Box id="topic-sidebar-panels" sx={{ display: { xs: "block", lg: open ? "block" : "none" } }}>
        <Box sx={{ position: "sticky", top: 16 }}>
          <ButtonBase
            ref={hideButtonRef}
            onClick={() => toggle(false)}
            aria-label="Hide Questions & Resources"
            aria-expanded={open}
            aria-controls="topic-sidebar-panels"
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 0.5,
              ml: "auto",
              mb: 1,
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
              borderRadius: "4px",
              transition: "color 150ms",
              "&:hover": { color: "primary.main" },
              ...focusRing,
            }}
          >
            Hide
            <Icon icon={PanelRightClose} size={16} />
          </ButtonBase>
          {children}
        </Box>
      </Box>
    </MotionBox>
  );
}
