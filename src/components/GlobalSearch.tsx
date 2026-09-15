import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { SearchPalette } from '@/components/search/SearchPalette';
import type { TestType } from '@/types/navigation';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType: TestType;
}

/** Mirrors MIN_QUERY_LENGTH in useGlobalSearch. */
const MIN_QUERY_LENGTH = 3;

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
      aria-label="Search"
      slotProps={{ paper: { sx: { borderRadius: 1, overflow: 'hidden' } } }}
    >
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
