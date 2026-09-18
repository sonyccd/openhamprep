import { createContext, useContext, useState, Dispatch, SetStateAction, ReactNode } from "react";
import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Tooltip from "@mui/material/Tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlossaryTerm } from "@/hooks/useGlossaryTerms";

// Context to ensure only one glossary term popover is open at a time on mobile
interface GlossaryTermContextValue {
  openTermId: string | null;
  setOpenTermId: Dispatch<SetStateAction<string | null>>;
}

const GlossaryTermContext = createContext<GlossaryTermContextValue | null>(null);

// Computes the next shared openTermId for a single popover's open/close
// event. Exported (and pure) so the "stale close after a newer open"
// ordering race can be tested directly, without depending on real DOM
// event timing to reproduce it.
export function nextOpenTermId(
  current: string | null,
  termId: string,
  open: boolean
): string | null {
  if (open) {
    return termId;
  }
  // Only clear if this term is still the active one - a stale close (e.g.
  // from term A's click-away firing after term B has already become active)
  // must not clobber B's open state.
  return current === termId ? null : current;
}

interface GlossaryTermProviderProps {
  children: ReactNode;
}

export function GlossaryTermProvider({ children }: GlossaryTermProviderProps) {
  const [openTermId, setOpenTermId] = useState<string | null>(null);

  return (
    <GlossaryTermContext.Provider value={{ openTermId, setOpenTermId }}>
      {children}
    </GlossaryTermContext.Provider>
  );
}

/** The definition card, shared by both trigger modes. */
function GlossaryTermContent({ term }: { term: GlossaryTerm }) {
  return (
    <>
      <Box component="p" sx={{ m: 0, mb: 0.5, fontWeight: 600, color: "primary.main" }}>
        {term.term}
      </Box>
      <Box component="p" sx={{ m: 0 }}>
        {term.definition}
      </Box>
    </>
  );
}

interface GlossaryTermTooltipProps {
  term: GlossaryTerm;
  /** Must accept a ref and event props — an element, not a fragment. */
  children: React.ReactElement;
}

/**
 * A glossary definition on a term in running text.
 *
 * One MUI Tooltip in two trigger modes, which is how MUI documents a
 * click-to-open tooltip: on desktop it opens on hover and on focus; on mobile
 * it is controlled, toggled by tap, and closed by tapping elsewhere. The old
 * version reached for a separate Popover on mobile to get tap-to-show.
 *
 * describeChild: the definition is the trigger's *description*, so the word
 * stays the accessible name and the sentence still reads as a sentence. The
 * old markup put "Antenna: A device that…" in an aria-label, which replaced
 * the word with the whole definition mid-sentence.
 *
 * Note: useIsMobile returns false during SSR/initial render, then updates
 * after hydration, so mobile users briefly get hover behaviour before tap
 * takes over. Acceptable — the content is reachable either way.
 */
export function GlossaryTermTooltip({ term, children }: GlossaryTermTooltipProps) {
  const isMobile = useIsMobile();
  const context = useContext(GlossaryTermContext);

  const tooltipSx = { maxWidth: 320, fontSize: "0.875rem" };

  if (isMobile) {
    const isOpen = context?.openTermId === term.id;
    const setOpen = (open: boolean) =>
      context?.setOpenTermId((current) => nextOpenTermId(current, term.id, open));

    return (
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Tooltip
          title={<GlossaryTermContent term={term} />}
          describeChild
          placement="top"
          open={isOpen}
          onClose={() => setOpen(false)}
          disableHoverListener
          disableFocusListener
          disableTouchListener
          slotProps={{ tooltip: { sx: tooltipSx } }}
        >
          <Box component="span" onClick={() => setOpen(!isOpen)} sx={{ display: "inline" }}>
            {children}
          </Box>
        </Tooltip>
      </ClickAwayListener>
    );
  }

  return (
    <Tooltip
      title={<GlossaryTermContent term={term} />}
      describeChild
      placement="top"
      enterDelay={200}
      slotProps={{ tooltip: { sx: tooltipSx } }}
    >
      {children}
    </Tooltip>
  );
}
