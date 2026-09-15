import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { visuallyHidden } from '@mui/utils';
import { useGlobalSearch, MIN_QUERY_LENGTH, SearchResult } from '@/hooks/useGlobalSearch';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { SearchPalette } from '@/components/search/SearchPalette';
import type { TestType } from '@/types/navigation';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType: TestType;
}

/**
 * Global search command palette.
 *
 * Built on MUI's useAutocomplete, replacing cmdk — this was its only consumer,
 * so the port removes the dependency outright along with ui/command.tsx.
 *
 * The hook rather than the full Autocomplete component because Autocomplete
 * renders its listbox in a floating Popper, and a palette needs the list in
 * the dialog under the input. The hook is Autocomplete's own engine, so the
 * WAI-ARIA combobox wiring, active-option tracking and the arrow/Enter/Escape
 * model all still come from MUI; only the layout is ours.
 */
export function GlobalSearch({ open, onOpenChange, testType }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { navigateToTopic, navigateToGlossaryTerm } = useAppNavigation();
  const { query, setQuery, results, isLoading, hasResults, reset, totalCount, error } =
    useGlobalSearch(testType);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset search state when closing
      reset();
    }
    onOpenChange(newOpen);
  };

  const handleSelect = (result: SearchResult) => {
    // Close the dialog first
    handleOpenChange(false);

    // Navigate based on result type
    switch (result.type) {
      case 'question':
        if (result.displayName) {
          navigate(`/questions/${result.displayName}`);
        }
        break;
      case 'glossary':
        navigateToGlossaryTerm(result.id);
        break;
      case 'topic':
        if (result.slug) {
          navigateToTopic(result.slug);
        }
        break;
      case 'tool':
        // Tools open in a new tab
        if (result.url) {
          window.open(result.url, '_blank', 'noopener,noreferrer');
        }
        break;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => handleOpenChange(false)}
      fullWidth
      maxWidth="sm"
      aria-labelledby="global-search-title"
      slotProps={{ paper: { sx: { borderRadius: 1, overflow: 'hidden' } } }}
    >
      {/*
        A real title, hidden. aria-label does not reach the dialog: MUI
        forwards only aria-labelledby/aria-describedby to the Paper that
        carries role="dialog", so a bare aria-label lands on the Modal root and
        names nothing. Worse, Dialog then generates its own aria-labelledby
        pointing at an id no element has — measured: role=dialog
        aria-labelledby=":r1:" with the palette reporting no accessible name.

        cmdk's CommandDialog supplied a VisuallyHidden DialogTitle for exactly
        this. Same shape here, same reason NavigationWarningDialog carries its
        labelling by hand (#283).
      */}
      <DialogTitle id="global-search-title" sx={visuallyHidden}>
        Search
      </DialogTitle>
      <SearchPalette
        query={query}
        onQueryChange={setQuery}
        results={results}
        isLoading={isLoading}
        hasResults={hasResults}
        totalCount={totalCount}
        error={Boolean(error)}
        minQueryLength={MIN_QUERY_LENGTH}
        onSelect={handleSelect}
        onClose={() => handleOpenChange(false)}
      />
    </Dialog>
  );
}
