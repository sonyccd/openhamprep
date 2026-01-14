import { createContext, useContext, useState, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlossaryTerm } from "@/hooks/useGlossaryTerms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Context to ensure only one glossary term popover is open at a time on mobile
interface GlossaryTermContextValue {
  openTermId: string | null;
  setOpenTermId: (id: string | null) => void;
}

const GlossaryTermContext = createContext<GlossaryTermContextValue | null>(null);

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

// Shared content component for consistent styling between Tooltip and Popover
function GlossaryTermContentInner({ term }: { term: GlossaryTerm }) {
  return (
    <>
      <p className="font-semibold text-primary mb-1">{term.term}</p>
      <p className="text-popover-foreground">{term.definition}</p>
    </>
  );
}

interface GlossaryTermTooltipProps {
  term: GlossaryTerm;
  children: ReactNode;
}

export function GlossaryTermTooltip({ term, children }: GlossaryTermTooltipProps) {
  // Note: useIsMobile returns false during SSR/initial render, then updates after hydration.
  // This means mobile users briefly see Tooltip (hover) behavior before Popover activates.
  // This is acceptable UX since the content is still visible and accessible.
  const isMobile = useIsMobile();
  const context = useContext(GlossaryTermContext);

  // On mobile, use Popover with tap-to-show behavior
  if (isMobile) {
    const isOpen = context?.openTermId === term.id;

    const handleOpenChange = (open: boolean) => {
      context?.setOpenTermId(open ? term.id : null);
    };

    return (
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-xs px-3 py-1.5 text-sm"
          side="top"
          sideOffset={4}
        >
          <GlossaryTermContentInner term={term} />
        </PopoverContent>
      </Popover>
    );
  }

  // On desktop, use Tooltip with hover behavior (unchanged from before)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm" side="top">
        <GlossaryTermContentInner term={term} />
      </TooltipContent>
    </Tooltip>
  );
}
