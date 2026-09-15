import { useMemo } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import useAutocomplete from "@mui/material/useAutocomplete";
import { visuallyHidden } from "@mui/utils";
import { Search } from "lucide-react";
import { GROUP_LABELS, SearchResultOption } from "./SearchResultOption";
import { SearchShortcutHints } from "./SearchShortcutHints";
import { SearchStatus } from "./SearchStatus";
import type { SearchResult, SearchResults } from "@/hooks/useGlobalSearch";

interface SearchPaletteProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResults;
  isLoading: boolean;
  hasResults: boolean;
  totalCount: number;
  error: boolean;
  minQueryLength: number;
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}

/**
 * The palette body: the input, the grouped listbox, and the states in between.
 *
 * Deliberately a separate component so it mounts only while the dialog is
 * open. useAutocomplete asserts in development that its input ref resolves to
 * an INPUT element, on every render and regardless of its `open` option
 * (useAutocomplete.js:581). Dialog unmounts its children when closed, so
 * calling the hook from the parent logs that error continuously while the
 * palette is shut.
 */
export function SearchPalette({
  query,
  onQueryChange,
  results,
  isLoading,
  hasResults,
  totalCount,
  error,
  minQueryLength,
  onSelect,
  onClose,
}: SearchPaletteProps) {
  /**
   * One flat list, in the order the groups are displayed.
   *
   * groupBy emits a heading per run of equal keys rather than per distinct key,
   * so the concatenation order here IS the display order — reorder it and the
   * headings duplicate.
   */
  const options = useMemo(
    () => [...results.questions, ...results.glossary, ...results.topics, ...results.tools],
    [results]
  );

  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions } =
    useAutocomplete<SearchResult, false, true, false>({
      id: "global-search",
      options,
      open: true,
      inputValue: query,
      onInputChange: (_event, value) => onQueryChange(value),
      // useGlobalSearch already searched on the server; filtering again here
      // would hide results it deliberately returned.
      filterOptions: (x) => x,
      groupBy: (option) => GROUP_LABELS[option.type],
      getOptionLabel: (option) => option.title,
      isOptionEqualToValue: (option, value) => option.id === value.id,
      disableClearable: true,
      // Choosing a result navigates away, so no value is ever held.
      value: null as never,
      onChange: (_event, value) => value && onSelect(value as SearchResult),
      clearOnBlur: false,
      // Escape has to come back out through the hook. useAutocomplete calls
      // stopPropagation on it — "Avoid the Modal to handle the event",
      // useAutocomplete.js:902 — so Dialog's own onClose never fires, and the
      // palette would ignore the key its footer advertises. Routing the hook's
      // close reason to the dialog keeps one Escape handler rather than two
      // fighting over the event.
      onClose: (_event, reason) => {
        if (reason === "escape") {
          onClose();
        }
      },
    });

  const { ref: inputRef, ...inputProps } = getInputProps();

  const grouped = groupedOptions as Array<{
    key: number;
    index: number;
    group: string;
    options: SearchResult[];
  }>;

  const statusMessage = error
    ? "Search failed. Please try again."
    : isLoading
      ? "Searching..."
      : query.length < minQueryLength
        ? ""
        : !hasResults
          ? `No results found for ${query}`
          : `${totalCount} result${totalCount === 1 ? "" : "s"} found`;

  return (
    <Box {...getRootProps()}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          component={Search}
          aria-hidden="true"
          sx={{ width: 16, height: 16, color: "text.secondary", flexShrink: 0 }}
        />
        {/*
          getInputProps returns native <input> attributes plus a ref, so they go
          through inputProps/inputRef — InputBase's own props are a different
          shape and spreading them directly does not typecheck.
        */}
        <InputBase
          // cmdk focused its input on mount; MUI's Dialog focuses the dialog
          // itself. Without this you have to click before you can type, which
          // defeats the point of a keyboard-opened palette.
          autoFocus
          inputRef={inputRef}
          inputProps={{ ...inputProps, "aria-label": "Search" }}
          placeholder="Search questions, glossary, topics, tools..."
          sx={{ flex: 1, py: 1.5, fontSize: "0.875rem" }}
        />
      </Box>

      {/* Screen reader status announcements */}
      <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
        {statusMessage}
      </Box>

      <SearchStatus
        error={error}
        isLoading={isLoading}
        queryLength={query.length}
        minQueryLength={minQueryLength}
        hasResults={hasResults}
        query={query}
      />

      {!error && !isLoading && grouped.length > 0 && (
        <Box
          component="ul"
          {...getListboxProps()}
          sx={{ maxHeight: 350, overflowY: "auto", m: 0, p: 1, listStyle: "none" }}
        >
          {grouped.map((group) => (
            <Box component="li" key={group.key} sx={{ listStyle: "none" }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.75,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                {group.group}
              </Box>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
                {group.options.map((result, index) => {
                  // group.index is the offset of this group's first option in
                  // the flattened list, which is what getOptionProps expects —
                  // the same arithmetic Autocomplete.js:822 does. `key` is
                  // React's and must not reach the DOM as an attribute.
                  const { key: _key, ...optionProps } = getOptionProps({
                    option: result,
                    index: group.index + index,
                  }) as ReturnType<typeof getOptionProps> & { key?: string };
                  return (
                    <SearchResultOption
                      key={`${result.type}-${result.id}`}
                      result={result}
                      optionProps={optionProps}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <SearchShortcutHints />
    </Box>
  );
}
