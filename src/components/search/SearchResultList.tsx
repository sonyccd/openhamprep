import Box from "@mui/material/Box";
import { SearchResultOption } from "./SearchResultOption";
import type { UseAutocompleteReturnValue } from "@mui/material/useAutocomplete";
import type { SearchResult } from "@/hooks/useGlobalSearch";
import type { HTMLAttributes } from "react";

export interface SearchResultGroup {
  key: number;
  /** Offset of this group's first option in the flattened option list. */
  index: number;
  group: string;
  options: SearchResult[];
}

interface SearchResultListProps {
  grouped: SearchResultGroup[];
  listboxProps: HTMLAttributes<HTMLUListElement>;
  /** Taken straight from the hook so the two signatures cannot drift. */
  getOptionProps: UseAutocompleteReturnValue<SearchResult>["getOptionProps"];
}

/** The grouped listbox: a heading per result type, options beneath each. */
export function SearchResultList({
  grouped,
  listboxProps,
  getOptionProps,
}: SearchResultListProps) {
  return (
    <Box
      component="ul"
      {...listboxProps}
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
  );
}
