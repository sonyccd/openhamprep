import { Icon } from "@/components/ohp/Icon";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { AlertCircle } from "lucide-react";

interface SearchStatusProps {
  error: boolean;
  isLoading: boolean;
  queryLength: number;
  minQueryLength: number;
  hasResults: boolean;
  query: string;
}

const centred = {
  py: 3,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  fontSize: "0.875rem",
} as const;

/**
 * Whatever the list shows when it is not showing results.
 *
 * Returns null once there are results, so the caller can render this above the
 * listbox unconditionally.
 */
export function SearchStatus({
  error,
  isLoading,
  queryLength,
  minQueryLength,
  hasResults,
  query,
}: SearchStatusProps) {
  if (error) {
    return (
      <Box role="alert" sx={{ ...centred, color: "error.main" }}>
        <Icon icon={AlertCircle} size={16} />
        Search failed. Please try again.
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box role="status" aria-label="Searching" sx={{ ...centred, color: "text.secondary" }}>
        <CircularProgress size={16} />
        Searching...
      </Box>
    );
  }

  if (queryLength < minQueryLength) {
    const remaining = minQueryLength - queryLength;
    return (
      <Box sx={{ py: 3, textAlign: "center", fontSize: "0.875rem", color: "text.secondary" }}>
        {queryLength === 0
          ? "Start typing to search..."
          : `Type ${remaining} more character${remaining === 1 ? "" : "s"}...`}
      </Box>
    );
  }

  if (!hasResults) {
    return (
      <Box sx={{ py: 3, textAlign: "center", fontSize: "0.875rem", color: "text.secondary" }}>
        No results found for "{query}"
      </Box>
    );
  }

  return null;
}
