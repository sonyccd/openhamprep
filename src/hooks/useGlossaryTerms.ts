import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/services/queryKeys";

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export function useGlossaryTerms() {
  return useQuery({
    queryKey: queryKeys.glossary.terms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, term, definition')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data as GlossaryTerm[];
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}
