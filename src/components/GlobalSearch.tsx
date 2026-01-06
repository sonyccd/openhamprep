import { useNavigate } from 'react-router-dom';
import { HelpCircle, BookText, Library, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { getModifierKey } from '@/lib/searchUtils';
import type { TestType } from '@/types/navigation';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType: TestType;
}

/**
 * Icon component for search result types
 */
function ResultIcon({ type }: { type: SearchResult['type'] }) {
  const iconClass = 'h-4 w-4 text-muted-foreground';

  switch (type) {
    case 'question':
      return <HelpCircle className={iconClass} aria-hidden="true" />;
    case 'glossary':
      return <BookText className={iconClass} aria-hidden="true" />;
    case 'topic':
      return <Library className={iconClass} aria-hidden="true" />;
    default:
      return null;
  }
}

/**
 * Get accessible label for result type
 */
function getResultTypeLabel(type: SearchResult['type']): string {
  switch (type) {
    case 'question':
      return 'Question';
    case 'glossary':
      return 'Glossary term';
    case 'topic':
      return 'Topic';
    default:
      return '';
  }
}

/**
 * Individual search result item
 */
function SearchResultItem({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: () => void;
}) {
  const typeLabel = getResultTypeLabel(result.type);

  return (
    <CommandItem
      value={`${result.type}-${result.id}-${result.title}`}
      onSelect={onSelect}
      className="flex items-start gap-3 py-3"
      aria-label={`${typeLabel}: ${result.title}. ${result.subtitle}`}
    >
      <div className="mt-0.5">
        <ResultIcon type={result.type} />
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="font-medium text-sm truncate">{result.title}</span>
        <span className="text-xs text-muted-foreground truncate">
          {result.subtitle}
        </span>
      </div>
    </CommandItem>
  );
}

/**
 * Global search command palette component.
 * Provides keyboard-driven search across questions, glossary, and topics.
 */
export function GlobalSearch({
  open,
  onOpenChange,
  testType,
}: GlobalSearchProps) {
  const navigate = useNavigate();
  const { setCurrentView, navigateToTopic, navigateToGlossaryTerm } =
    useAppNavigation();
  const { query, setQuery, results, isLoading, hasResults, reset, totalCount } =
    useGlobalSearch(testType);

  /**
   * Generate screen reader status message
   */
  const getStatusMessage = (): string => {
    if (isLoading) return 'Searching...';
    if (query.length < 3) return '';
    if (!hasResults) return `No results found for ${query}`;
    return `${totalCount} result${totalCount === 1 ? '' : 's'} found`;
  };

  /**
   * Handle dialog open/close state changes
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset search state when closing
      reset();
    }
    onOpenChange(newOpen);
  };

  /**
   * Handle selection of a search result
   */
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
    }
  };

  const modKey = getModifierKey();

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search questions, glossary, topics..."
        value={query}
        onValueChange={setQuery}
      />
      {/* Screen reader status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {getStatusMessage()}
      </div>

      <CommandList className="max-h-[350px]">
        {/* Loading state */}
        {isLoading && (
          <div
            className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-label="Searching"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching...
          </div>
        )}

        {/* Empty state - only show when we have a query of sufficient length but no results */}
        {!isLoading && query.length >= 3 && !hasResults && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {/* Initial state - show when dialog is open but no query or query too short */}
        {!isLoading && query.length < 3 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {query.length === 0
              ? 'Start typing to search...'
              : `Type ${3 - query.length} more character${3 - query.length === 1 ? '' : 's'}...`}
          </div>
        )}

        {/* Questions results */}
        {!isLoading && results.questions.length > 0 && (
          <CommandGroup heading="Questions">
            {results.questions.map((result) => (
              <SearchResultItem
                key={`question-${result.id}`}
                result={result}
                onSelect={() => handleSelect(result)}
              />
            ))}
          </CommandGroup>
        )}

        {/* Glossary results */}
        {!isLoading && results.glossary.length > 0 && (
          <>
            {results.questions.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Glossary">
              {results.glossary.map((result) => (
                <SearchResultItem
                  key={`glossary-${result.id}`}
                  result={result}
                  onSelect={() => handleSelect(result)}
                />
              ))}
            </CommandGroup>
          </>
        )}

        {/* Topics results */}
        {!isLoading && results.topics.length > 0 && (
          <>
            {(results.questions.length > 0 || results.glossary.length > 0) && (
              <CommandSeparator />
            )}
            <CommandGroup heading="Topics">
              {results.topics.map((result) => (
                <SearchResultItem
                  key={`topic-${result.id}`}
                  result={result}
                  onSelect={() => handleSelect(result)}
                />
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Keyboard hints footer */}
      <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">↑↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">↵</kbd>
          Select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">Esc</kbd>
          Close
        </span>
      </div>
    </CommandDialog>
  );
}
