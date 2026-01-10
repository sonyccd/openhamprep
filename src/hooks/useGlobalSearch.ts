import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTestTypePrefix } from '@/lib/testTypeUtils';
import { truncateText } from '@/lib/searchUtils';
import type { TestType } from '@/types/navigation';

/**
 * Unified search result type for displaying in the command palette
 */
export interface SearchResult {
  type: 'question' | 'glossary' | 'topic' | 'tool';
  id: string;
  title: string;
  subtitle: string;
  displayName?: string; // For questions - used for navigation
  slug?: string; // For topics - used for navigation
  url?: string; // For tools - external URL
}

/**
 * Grouped search results by content type
 */
export interface SearchResults {
  questions: SearchResult[];
  glossary: SearchResult[];
  topics: SearchResult[];
  tools: SearchResult[];
}

/**
 * Raw response from the search_content RPC function
 */
interface SearchContentResponse {
  questions: Array<{
    id: string;
    display_name: string;
    question: string;
    explanation: string;
    rank: number;
  }>;
  glossary: Array<{
    id: string;
    term: string;
    definition: string;
    rank: number;
  }>;
  topics: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    rank: number;
  }>;
  tools: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    rank: number;
  }>;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3; // Minimum characters before searching
const EMPTY_RESULTS: SearchResults = {
  questions: [],
  glossary: [],
  topics: [],
  tools: [],
};

/**
 * Hook for global keyword search functionality.
 * Handles debouncing, Supabase RPC calls, and result transformation.
 *
 * @param testType - Current license filter (technician, general, extra)
 * @returns Search state and controls
 */
export function useGlobalSearch(testType: TestType) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Track request ID to ignore stale responses when testType changes mid-flight
  const requestIdRef = useRef(0);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute search when debounced query changes
  useEffect(() => {
    // Don't search if query is empty or too short
    if (!debouncedQuery || debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    async function performSearch() {
      setIsLoading(true);
      setError(null);

      try {
        const licensePrefix = getTestTypePrefix(testType);

        const { data, error: rpcError } = await supabase.rpc('search_content', {
          search_query: debouncedQuery,
          license_prefix: licensePrefix,
          questions_limit: 5,
          glossary_limit: 5,
          topics_limit: 3,
        });

        // Ignore stale responses (from previous requests or if component unmounted)
        if (abortController.signal.aborted || currentRequestId !== requestIdRef.current) {
          return;
        }

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        const response = data as SearchContentResponse;

        // Transform raw results into unified SearchResult format
        const transformedResults: SearchResults = {
          questions: (response?.questions || []).map((q) => ({
            type: 'question' as const,
            id: q.id,
            title: q.display_name,
            subtitle: truncateText(q.question, 80),
            displayName: q.display_name,
          })),
          glossary: (response?.glossary || []).map((g) => ({
            type: 'glossary' as const,
            id: g.id,
            title: g.term,
            subtitle: truncateText(g.definition, 80),
          })),
          topics: (response?.topics || []).map((t) => ({
            type: 'topic' as const,
            id: t.id,
            title: t.title,
            subtitle: truncateText(t.description || '', 80),
            slug: t.slug,
          })),
          tools: (response?.tools || []).map((tool) => ({
            type: 'tool' as const,
            id: tool.id,
            title: tool.title,
            subtitle: truncateText(tool.description, 80),
            url: tool.url,
          })),
        };

        setResults(transformedResults);
      } catch (err) {
        // Only update error state if this is still the current request
        if (!abortController.signal.aborted && currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err : new Error('Search failed'));
          setResults(EMPTY_RESULTS);
        }
      } finally {
        // Only update loading state if this is still the current request
        if (!abortController.signal.aborted && currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    performSearch();

    return () => {
      abortController.abort();
    };
  }, [debouncedQuery, testType]);

  // Calculate total result count
  const totalCount = useMemo(() => {
    return (
      results.questions.length +
      results.glossary.length +
      results.topics.length +
      results.tools.length
    );
  }, [results]);

  // Check if there are any results
  const hasResults = totalCount > 0;

  // Reset search state
  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults(EMPTY_RESULTS);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    totalCount,
    hasResults,
    reset,
  };
}
